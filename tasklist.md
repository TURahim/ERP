# InvoiceMe ERP: PR-Scoped Task Lists

**Document:** Pull Request Task Breakdown  
**Date:** November 7, 2025  
**Source:** PRD.md (Finalized with DECISIONS.md)  
**Purpose:** Break down implementation into reviewable, testable PRs

---

## Table of Contents
1. [Frontend Phase (v0): UI with Mock Data](#frontend-phase-v0)
2. [Backend Phase (Cursor): API, DB, Tests](#backend-phase-cursor)
3. [Integration Phase: Wire Frontend to Real APIs](#integration-phase)
4. [PR Review Guidelines](#pr-review-guidelines)

---

## Gap Mitigation Summary
- **Unified error envelope:** Standardize `{ error: { code, message, timestamp } }` responses across the stack. Backend returns the envelope from a dedicated advice layer; frontend interceptors rely on it.
- **Secret handling:** Stop exposing API keys via `NEXT_PUBLIC_*`. Route all real API calls through server-only code with `API_KEY` environment vars and document the demo-only fallback.
- **Contract source of truth:** Pull OpenAPI authoring forward, generate frontend types/clients from it, and eliminate hand-written DTO duplication.
- **Invoice numbering correctness:** Replace the monotonic sequence with a year-scoped counter guarded by transactional uniqueness.
- **Payment immutability & idempotency:** Persist idempotency keys, prevent updates/deletes, and enforce invariants at both DB and service layers.
- **Money & time accuracy:** Use `timestamptz`, centralize rounding rules, and cover edge cases in tests.
- **Right-sized architecture:** Keep vertical slices but ensure command/query handlers add real business logic instead of pass-through mapping.
- **UI component correctness:** Align shadcn usage with its form primitives and extend design tokens (e.g., badge variants) in theme files.
- **Deterministic data fetching:** Standardize on React Query with well-defined keys and invalidation patterns.
- **Mock vs real services:** Provide interchangeable service adapters so the UI swaps between mock data and real APIs without code changes.
- **Testing coverage expansion:** Add targeted tests for overpayment, optimistic locking conflicts, and lifecycle transitions (including concurrency).
- **Database prerequisites:** Enable required extensions up front and document them; ensure schema reflects operational rules (e.g., soft activation flows).
- **Operational hygiene:** Introduce CI pipelines, PR guardrails, accessibility/i18n baked into components, and clear README guidance for mock vs API modes.

---

# Frontend Phase (v0)

## Phase Overview
**Goal:** Build complete UI with mock API, ready for backend integration  
**Stack:** Next.js 14 (App Router) + TypeScript + shadcn/ui + TailwindCSS  
**Timeline:** Days 1-2 (Frontend PRs 1-8)  
**Dependencies:** None (mock data only)

---

## FR-001: Project Setup & Infrastructure
**Branch:** `feat/frontend-setup`  
**Size:** ~200 LOC  
**Priority:** P0 (Blocking)  
**Dependencies:** None

### Tasks
- [ ] Initialize Next.js 14 project with App Router
- [ ] Configure TypeScript (strict mode)
- [ ] Install dependencies: shadcn/ui, tailwind, react-hook-form, zod, axios, @tanstack/react-query
- [ ] Set up folder structure (see below)
- [ ] Configure ESLint + Prettier
- [ ] Create `.env.example` with `API_BASE_URL`, `API_KEY`, and `NEXT_PUBLIC_USE_MOCK_API`
- [ ] Add `.gitignore` (node_modules, .next, .env.local)
- [ ] Configure `QueryClientProvider` (with devtools) in `app/layout.tsx` or a root provider component

### Folder Structure
```
/app
  /customers
  /invoices
  /payments
  /dashboard
  layout.tsx
  page.tsx
/components
  /ui (shadcn)
  /forms
  /tables
  /layout
/lib
  /services
  /hooks
  /types
  /utils
```

### Acceptance Criteria
- [ ] `npm install` succeeds
- [ ] `npm run dev` starts app on localhost:3000
- [ ] `npm run lint` passes
- [ ] README.md includes setup instructions and explains mock vs API proxy env vars (no secrets in public env)

### Files Changed
- `package.json`, `tsconfig.json`, `next.config.js`
- `tailwind.config.js`, `.eslintrc.json`, `.prettierrc`
- `app/layout.tsx`, `app/page.tsx`
- `README.md`, `.env.example`

---

## FR-002: TypeScript Types & API Client
**Branch:** `feat/frontend-types`  
**Size:** ~300 LOC  
**Priority:** P0 (Blocking)  
**Dependencies:** FR-001

### Tasks
- [ ] Install `openapi-typescript` and add `npm run generate:types`
- [ ] Author initial `schema/openapi.yaml` (mirrors PRD contracts) and keep it in sync with backend PRs
- [ ] Generate `lib/types/generated.ts` from OpenAPI spec (no hand-written DTO duplication)
- [ ] Create domain-friendly re-exports in `lib/types/index.ts`
- [ ] Create base API client that targets `/api/backend` proxy route and normalizes the error envelope

### Type Definitions
```typescript
// lib/types/index.ts
import type { components, paths } from '@/lib/types/generated';

export type Customer = components['schemas']['Customer'];
export type CreateCustomerRequest = components['schemas']['CreateCustomerRequest'];
export type UpdateCustomerRequest = components['schemas']['UpdateCustomerRequest'];

export type Invoice = components['schemas']['Invoice'];
export type InvoiceStatus = components['schemas']['Invoice']['status'];
export type CreateInvoiceRequest = components['schemas']['CreateInvoiceRequest'];
export type UpdateInvoiceRequest = components['schemas']['UpdateInvoiceRequest'];
export type InvoiceLineItem = components['schemas']['InvoiceLineItem'];

export type Payment = components['schemas']['Payment'];
export type PaymentMethod = components['schemas']['Payment']['paymentMethod'];
export type CreatePaymentRequest = components['schemas']['CreatePaymentRequest'];

export type PaginationMeta = components['schemas']['PaginationMeta'];
export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationMeta;
}

export type ErrorEnvelope = components['schemas']['ErrorEnvelope'];
export type ApiError = ErrorEnvelope['error'];

export type CustomerListResponse = paths['/api/customers']['get']['responses']['200']['content']['application/json'];
```

### API Client
```typescript
// lib/services/api.ts
import axios from 'axios';
import type { ErrorEnvelope } from '@/lib/types';

export const apiClient = axios.create({
  baseURL: '/api/backend', // Next.js route handler proxies to backend and injects API key server-side
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const envelope = error.response?.data as ErrorEnvelope | undefined;

    if (envelope?.error) {
      return Promise.reject(envelope.error);
    }

    if (error.response?.status === 401) {
      console.error('Invalid API Key');
    }

    return Promise.reject(error);
  }
);
```

### Backend Proxy Route
```typescript
// app/api/backend/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8080';
const API_KEY = process.env.API_KEY ?? 'demo-api-key-12345';

async function proxy(request: NextRequest, init: RequestInit = {}) {
  const url = new URL(request.url);
  const target = `${API_BASE_URL}${url.pathname.replace('/api/backend', '')}${url.search}`;

  const body =
    init.body ??
    (request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined);

  const response = await fetch(target, {
    ...init,
    body,
    headers: {
      ...Object.fromEntries(request.headers),
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: response.headers,
  });
}

export const GET = (request: NextRequest, context: NextRequestContext) =>
  proxy(request, { method: 'GET' });
export const POST = (request: NextRequest, context: NextRequestContext) =>
  proxy(request, { method: 'POST' });
// Repeat for PUT/DELETE/PATCH as needed
```

### Acceptance Criteria
- [ ] `npm run generate:types` succeeds and updates `lib/types/generated.ts` from the single OpenAPI spec
- [ ] No hand-written DTOs drift from the backend contract (all re-exported from generated types)
- [ ] API client routes through `/api/backend` proxy and normalizes the standard error envelope
- [ ] No TypeScript errors

### Files Changed
- `lib/types/customer.types.ts`, `invoice.types.ts`, `payment.types.ts`, `api.types.ts`
- `lib/types/index.ts`
- `lib/services/api.ts`

---

## FR-003: Mock API Implementation
**Branch:** `feat/frontend-mock-api`  
**Size:** ~400 LOC  
**Priority:** P0 (Blocking)  
**Dependencies:** FR-002

### Tasks
- [ ] Create mock API service in `lib/services/mockApi.ts`
- [ ] Implement all 13 endpoints from PRD Section 7.1
- [ ] Add in-memory state management (arrays for entities)
- [ ] Seed fixture data: 10 customers, 20 invoices, 15 payments
- [ ] Simulate 200ms network latency with `setTimeout`
- [ ] Return proper HTTP status codes (200, 201, 400, 404)
- [ ] Validate X-API-Key header in mock
- [ ] Define `CustomerService`, `InvoiceService`, `PaymentService` interfaces in `lib/services/contracts.ts` and ensure mock implementation satisfies them (real client will reuse)
- [ ] Ensure mock responses and errors conform to the shared OpenAPI schemas

### Endpoints to Mock
```typescript
// Mock API structure
class MockApiService {
  private customers: Customer[] = [];
  private invoices: Invoice[] = [];
  private payments: Payment[] = [];
  
  // Customer endpoints
  async getCustomers(params: { page: number; size: number; includeInactive?: boolean }): Promise<ApiResponse<Customer[]>>
  async createCustomer(data: CreateCustomerRequest): Promise<Customer>
  async getCustomerById(id: string): Promise<Customer>
  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer>
  async deactivateCustomer(id: string): Promise<Customer>
  
  // Invoice endpoints
  async getInvoices(params: { status?: InvoiceStatus; customerId?: string; page: number; size: number }): Promise<ApiResponse<Invoice[]>>
  async createInvoice(data: CreateInvoiceRequest): Promise<Invoice>
  async getInvoiceById(id: string): Promise<Invoice>
  async updateInvoice(id: string, data: UpdateInvoiceRequest): Promise<Invoice>
  async sendInvoice(id: string): Promise<Invoice>
  async getInvoicePayments(id: string): Promise<Payment[]>
  
  // Payment endpoints
  async createPayment(data: CreatePaymentRequest): Promise<Payment>
  async getPaymentById(id: string): Promise<Payment>
}
```

### Fixture Data Seeds
```typescript
// 10 Customers (2 inactive)
customers = [
  { id: 'c1', name: 'Acme Corp', email: 'billing@acme.com', isActive: true, ... },
  { id: 'c2', name: 'TechStart Inc', email: null, isActive: true, ... },
  // ... 8 more
  { id: 'c9', name: 'Old Client', email: 'old@example.com', isActive: false, ... },
];

// 20 Invoices (5 DRAFT, 10 SENT, 5 PAID)
invoices = [
  { id: 'i1', customerId: 'c1', invoiceNumber: 'INV-2025-0001', status: 'DRAFT', total: 1000, balance: 1000, lineItems: [...], ... },
  // ... more
];

// 15 Payments
payments = [
  { id: 'p1', invoiceId: 'i11', amount: 500, paymentMethod: 'Wire', ... },
  // ... more
];
```

### Acceptance Criteria
- [ ] All 13 API endpoints mocked
- [ ] Fixture data includes specified counts
- [ ] Network latency simulated (200ms)
- [ ] Invoice balance computed correctly (total - SUM(payments))
- [ ] Overpayment rejected with 400 error
- [ ] Invalid API key returns 401 with the standard error envelope
- [ ] Invoice edit validation (DRAFT only)

### Service Contract Example
```typescript
// lib/services/contracts.ts
export interface CustomerService {
  list(params: { page: number; size: number; includeInactive?: boolean }): Promise<ApiResponse<Customer[]>>;
  get(id: string): Promise<Customer>;
  create(payload: CreateCustomerRequest): Promise<Customer>;
  update(id: string, payload: UpdateCustomerRequest): Promise<Customer>;
  deactivate(id: string): Promise<Customer>;
}

export interface InvoiceService { /* create, update, send, etc. */ }
export interface PaymentService { /* record, get, list */ }

export type ServiceRegistry = {
  customers: CustomerService;
  invoices: InvoiceService;
  payments: PaymentService;
};

const ServiceContext = createContext<ServiceRegistry | null>(null);

export function ServiceProvider({ children }: PropsWithChildren) {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
  const services = useMemo<ServiceRegistry>(
    () => (useMock ? mockServices : realServices), // mockServices/realServices are concrete adapters defined in lib/services/mock|real
    [useMock]
  );

  return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>;
}

export function useService<Name extends keyof ServiceRegistry>(name: Name): ServiceRegistry[Name] {
  const services = useContext(ServiceContext);
  if (!services) throw new Error('ServiceProvider missing');
  return services[name];
}
```

### Files Changed
- `lib/services/mockApi.ts`

---

## FR-004: Shared Components & Layout
**Branch:** `feat/frontend-shared-components`  
**Size:** ~300 LOC  
**Priority:** P0 (Blocking)  
**Dependencies:** FR-001, FR-002

### Tasks
- [ ] Install shadcn/ui components: Button, Input, Table, Badge, Select, Textarea, DatePicker, Dialog, Toast
- [ ] Extend shadcn theme tokens (e.g., `Badge` `success` variant) in `components/ui/badge.tsx`
- [ ] Create Navbar component in `components/layout/Navbar.tsx`
- [ ] Create StatusBadge component for invoice statuses
- [ ] Create LoadingSkeleton components (TableSkeleton, CardSkeleton)
- [ ] Create EmptyState component
- [ ] Update `app/layout.tsx` with Navbar and Toaster
- [ ] Create Dashboard page (optional summary cards)

### Navbar Component
```tsx
// components/layout/Navbar.tsx
export function Navbar() {
  return (
    <nav className="border-b">
      <div className="container flex h-16 items-center">
        <Link href="/" className="font-bold text-xl">InvoiceMe</Link>
        <div className="ml-auto flex gap-4">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/customers">Customers</Link>
          <Link href="/invoices">Invoices</Link>
        </div>
        <Badge variant="outline" className="ml-4">Demo Mode</Badge>
      </div>
    </nav>
  );
}
```

### StatusBadge Component
```tsx
// components/ui/StatusBadge.tsx
export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const variants = {
    DRAFT: 'secondary',
    SENT: 'default',
    PAID: 'success',
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}
```
> Define the custom `success` badge variant via `cva` in `components/ui/badge.tsx` so that design tokens remain centralized.

### Dashboard (Optional)
```tsx
// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="container py-8">
      <h1>Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>Total Customers</CardHeader>
          <CardContent><div className="text-3xl">42</div></CardContent>
        </Card>
        {/* More cards */}
      </div>
    </div>
  );
}
```

### Acceptance Criteria
- [ ] Navbar displays on all pages
- [ ] Status badges show correct colors (DRAFT=gray, SENT=blue, PAID=green)
- [ ] Loading skeletons match table/card layouts
- [ ] Empty states show helpful messages
- [ ] Toaster configured for notifications

### Files Changed
- `components/layout/Navbar.tsx`
- `components/ui/StatusBadge.tsx`, `TableSkeleton.tsx`, `CardSkeleton.tsx`, `EmptyState.tsx`
- `app/layout.tsx`
- `app/dashboard/page.tsx` (optional)

---

## FR-005: Customer Feature - Pages & Forms
**Branch:** `feat/frontend-customers`  
**Size:** ~500 LOC  
**Priority:** P0  
**Dependencies:** FR-003, FR-004

### Tasks
- [ ] Create Customer List page (`app/customers/page.tsx`)
  - Data table with columns: Name, Email, # Invoices, Status, Actions
  - Pagination controls
  - Toggle for inactive customers
  - "Create Customer" button
  - Prefer server component for list shell; isolate client hooks/forms in children
- [ ] Create Customer Detail page (`app/customers/[id]/page.tsx`)
  - Display customer info
  - List of invoices
  - Edit and Deactivate buttons
- [ ] Create Customer Form component (`components/forms/CustomerForm.tsx`)
  - Fields: Name (required), Email (optional), Billing Address (optional)
  - Validation with react-hook-form + zod
- [ ] Create Customer Create page (`app/customers/new/page.tsx`)
- [ ] Create Customer Edit page (`app/customers/[id]/edit/page.tsx`)
- [ ] Create useCustomers hook (`lib/hooks/useCustomers.ts`)
  - CRUD operations via `CustomerService` abstraction (mock or real)
  - Use TanStack React Query with query keys `['customers', { includeInactive, page, size }]`
  - Invalidate deterministically after create/update/deactivate mutations

### Customer List Page
```tsx
// app/customers/page.tsx
'use client';

export default function CustomersPage() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const { data, isLoading } = useCustomers({ includeInactive });
  
  if (isLoading) return <TableSkeleton />;
  if (!data?.length) return <EmptyState message="No customers found" />;
  
  return (
    <div className="container py-8">
      <div className="flex justify-between mb-4">
        <h1>Customers</h1>
        <Button asChild><Link href="/customers/new">Create Customer</Link></Button>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <Switch checked={includeInactive} onCheckedChange={setIncludeInactive} />
        <label>Show inactive customers</label>
      </div>
      <Table>
        {/* Table implementation */}
      </Table>
    </div>
  );
}
```

### Customer Form
```tsx
// components/forms/CustomerForm.tsx
const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  billingAddress: z.string().optional(),
});

export function CustomerForm({ initialData, onSubmit }: Props) {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData,
  });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="billingAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing Address</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save</Button>
      </form>
    </Form>
  );
}
```

### useCustomers Hook
```tsx
// lib/hooks/useCustomers.ts
export function useCustomers(params?: { includeInactive?: boolean }) {
  const customerService = useService('customers');
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customerService.list({ page: 0, size: 20, ...params }),
  });
}

export function useCustomer(id: string) {
  const customerService = useService('customers');
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => customerService.get(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const customerService = useService('customers');
  return useMutation({
    mutationFn: (payload: CreateCustomerRequest) => customerService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created');
    },
  });
}

// Similar hooks for update, deactivate (always invalidate ['customers'])
```

### Acceptance Criteria
- [ ] Customer list displays with pagination
- [ ] Toggle shows/hides inactive customers
- [ ] Create form validates required fields
- [ ] Email shows duplicate warning (non-blocking)
- [ ] Edit form pre-populates data
- [ ] Deactivate button only shows if no invoices exist (mock check)
- [ ] Success toasts display on create/update
- [ ] Error handling for API failures
- [ ] React Query invalidations keep list/detail views in sync without manual refresh

### Files Changed
- `app/customers/page.tsx`, `[id]/page.tsx`, `new/page.tsx`, `[id]/edit/page.tsx`
- `components/forms/CustomerForm.tsx`
- `lib/hooks/useCustomers.ts`

---

## FR-006: Invoice Feature - Pages & Forms
**Branch:** `feat/frontend-invoices`  
**Size:** ~600 LOC  
**Priority:** P0  
**Dependencies:** FR-003, FR-004, FR-005

### Tasks
- [ ] Create Invoice List page (`app/invoices/page.tsx`)
  - Data table with filters (status, customer)
  - Status badges
  - Pagination
  - Keep top-level page as server component; delegate client state (filters) to nested client components
- [ ] Create Invoice Detail page (`app/invoices/[id]/page.tsx`)
  - Invoice summary
  - Line items table
  - Payment history
  - Action buttons (Edit, Send, Record Payment)
- [ ] Create Invoice Form component (`components/forms/InvoiceForm.tsx`)
  - Customer selector
  - Dynamic line items (useFieldArray)
  - Discount, notes, due date fields
  - Auto-calculate totals
- [ ] Create Invoice Create page (`app/invoices/new/page.tsx`)
- [ ] Create Invoice Edit page (`app/invoices/[id]/edit/page.tsx`)
- [ ] Create useInvoices hook (`lib/hooks/useInvoices.ts`)
  - Query keys: `['invoices', { status, customerId, page, size }]`
  - Use `InvoiceService` from the shared service registry
  - Invalidate queries (`['invoices']`, `['invoices', id]`, `['customers', invoice.customerId]`) after mutations
- [ ] Create Send Invoice confirmation dialog

### Invoice Detail Page
```tsx
// app/invoices/[id]/page.tsx
'use client';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { data: invoice, isLoading } = useInvoice(params.id);
  
  if (isLoading) return <CardSkeleton />;
  if (!invoice) return <EmptyState message="Invoice not found" />;
  
  return (
    <div className="container py-8">
      <div className="flex justify-between mb-4">
        <div>
          <h1>{invoice.invoiceNumber}</h1>
          <StatusBadge status={invoice.status} />
        </div>
        <div className="flex gap-2">
          {invoice.status === 'DRAFT' && (
            <>
              <Button asChild><Link href={`/invoices/${invoice.id}/edit`}>Edit</Link></Button>
              <Button onClick={handleSend}>Mark as Sent</Button>
            </>
          )}
          {(invoice.status === 'SENT' || invoice.status === 'PAID') && (
            <Button asChild><Link href={`/invoices/${invoice.id}/payments/new`}>Record Payment</Link></Button>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>Invoice Details</CardHeader>
        <CardContent>
          <dl>
            <dt>Customer</dt><dd>{invoice.customer?.name}</dd>
            <dt>Total</dt><dd>${invoice.total.toFixed(2)}</dd>
            <dt>Balance</dt><dd className="font-bold">${invoice.balance.toFixed(2)}</dd>
            <dt>Due Date</dt><dd>{invoice.dueDate || 'N/A'}</dd>
          </dl>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>Line Items</CardHeader>
        <CardContent>
          <Table>
            {/* Line items table */}
          </Table>
          {invoice.discount > 0 && (
            <div className="mt-2 text-right">
              <span>Discount: -${invoice.discount.toFixed(2)}</span>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>Payment History</CardHeader>
        <CardContent>
          {invoice.payments?.length ? (
            <Table>{/* Payments table */}</Table>
          ) : (
            <EmptyState message="No payments recorded" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### Invoice Form
```tsx
// components/forms/InvoiceForm.tsx
const invoiceSchema = z.object({
  customerId: z.string().uuid(),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
  })).min(1, 'At least one line item required'),
  discount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
});

export function InvoiceForm({ initialData, onSubmit }: Props) {
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialData || { lineItems: [{ description: '', quantity: 1, unitPrice: 0 }] },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });
  
  const watchedLineItems = form.watch('lineItems');
  const watchedDiscount = form.watch('discount') || 0;
  
  const subtotal = watchedLineItems.reduce((sum, item) => 
    sum + (item.quantity * item.unitPrice), 0
  );
  const total = subtotal - watchedDiscount;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <FormControl>
                <CustomerSelector value={field.value} onValueChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Line Items</h3>
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-2 md:grid-cols-[4fr,1fr,1fr,auto]">
              <FormField
                control={form.control}
                name={`lineItems.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`lineItems.${index}.quantity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`lineItems.${index}.unitPrice`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Unit price</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="ghost" onClick={() => remove(index)}>
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}>
            Add Line Item
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-md border p-4 text-right">
          <div>Subtotal: ${subtotal.toFixed(2)}</div>
          {watchedDiscount > 0 && <div>Discount: -${watchedDiscount.toFixed(2)}</div>}
          <div className="font-semibold text-lg">Total: ${total.toFixed(2)}</div>
        </div>

        <Button type="submit">Save Invoice</Button>
      </form>
    </Form>
  );
}
```

### Acceptance Criteria
- [ ] Invoice list filters by status and customer
- [ ] Invoice detail shows all sections (info, line items, payments)
- [ ] Invoice form validates at least 1 line item
- [ ] Total auto-calculates: SUM(line_items) - discount
- [ ] Dynamic line items work (add/remove rows)
- [ ] Edit only enabled for DRAFT status
- [ ] "Mark as Sent" button shows confirmation dialog
- [ ] Action buttons context-aware based on status
- [ ] Query cache stays consistent across list/detail views after mutations (React Query invalidations verified)

### Files Changed
- `app/invoices/page.tsx`, `[id]/page.tsx`, `new/page.tsx`, `[id]/edit/page.tsx`
- `components/forms/InvoiceForm.tsx`
- `lib/hooks/useInvoices.ts`

---

## FR-007: Payment Feature - Pages & Forms
**Branch:** `feat/frontend-payments`  
**Size:** ~300 LOC  
**Priority:** P0  
**Dependencies:** FR-003, FR-004, FR-006

### Tasks
- [ ] Create Record Payment page (`app/invoices/[id]/payments/new/page.tsx`)
  - Display invoice summary
  - Payment form with validation
  - Real-time balance calculation
- [ ] Create Payment Detail page (`app/payments/[id]/page.tsx`)
- [ ] Create Payment Form component (`components/forms/PaymentForm.tsx`)
  - Amount field with max = balance validation
  - Payment method dropdown (enum)
  - Notes field
- [ ] Ensure Payment form submits a unique `idempotencyKey` per attempt (surfaced via service layer)
- [ ] Create usePayments hook (`lib/hooks/usePayments.ts`)
  - Use React Query with keys `['payments', invoiceId]`
  - Invalidate `['invoices', invoiceId]` and `['payments', invoiceId]` after mutation

### Record Payment Page
```tsx
// app/invoices/[id]/payments/new/page.tsx
'use client';

export default function RecordPaymentPage({ params }: { params: { id: string } }) {
  const { data: invoice } = useInvoice(params.id);
  const createPayment = useCreatePayment();
  
  if (!invoice) return null;
  
  const handleSubmit = (data: CreatePaymentRequest) => {
    createPayment.mutate(data, {
      onSuccess: () => {
        router.push(`/invoices/${invoice.id}`);
      },
    });
  };
  
  return (
    <div className="container py-8 max-w-2xl">
      <h1>Record Payment</h1>
      
      <Card className="mb-6">
        <CardHeader>Invoice Summary</CardHeader>
        <CardContent>
          <dl>
            <dt>Invoice Number</dt><dd>{invoice.invoiceNumber}</dd>
            <dt>Customer</dt><dd>{invoice.customer?.name}</dd>
            <dt>Total</dt><dd>${invoice.total.toFixed(2)}</dd>
            <dt>Balance Due</dt><dd className="font-bold text-lg">${invoice.balance.toFixed(2)}</dd>
          </dl>
        </CardContent>
      </Card>
      
      <PaymentForm 
        invoiceId={invoice.id}
        maxAmount={invoice.balance}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

### Payment Form
```tsx
// components/forms/PaymentForm.tsx
const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(['Cash', 'Card', 'Wire', 'ACH', 'Check', 'Other']).optional(),
  notes: z.string().optional(),
});

export function PaymentForm({ invoiceId, maxAmount, onSubmit }: Props) {
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: maxAmount },
  });
  
  const watchedAmount = form.watch('amount');
  const isOverpayment = watchedAmount > maxAmount;
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());
  
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) =>
          onSubmit({ ...data, invoiceId, idempotencyKey: idempotencyKeyRef.current })
        )}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  {...field}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                />
              </FormControl>
              {isOverpayment && (
                <p className="text-sm text-destructive">
                  Amount cannot exceed balance (${maxAmount.toFixed(2)})
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Wire">Wire Transfer</SelectItem>
                  <SelectItem value="ACH">ACH</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Check number, reference, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-4 rounded bg-muted p-4">
          <div className="flex justify-between">
            <span>Remaining Balance After Payment:</span>
            <span className="font-bold">
              ${(maxAmount - (watchedAmount || 0)).toFixed(2)}
            </span>
          </div>
        </div>

        <Alert className="mt-4" variant="warning">
          Payments cannot be edited or deleted after submission.
        </Alert>

        <Button type="submit" disabled={isOverpayment}>
          Record Payment
        </Button>
      </form>
    </Form>
  );
}
```

### Acceptance Criteria
- [ ] Payment form pre-fills with full balance
- [ ] Amount validation: must be > 0 and ≤ balance
- [ ] Real-time remaining balance calculation
- [ ] Overpayment shows error and disables submit
- [ ] Payment method dropdown shows enum values
- [ ] Success toast on submission
- [ ] Redirect to invoice detail after success
- [ ] Warning shown: "Payments are immutable"
- [ ] Idempotency keys prevent duplicate payment submissions (verified manually)

### Files Changed
- `app/invoices/[id]/payments/new/page.tsx`
- `app/payments/[id]/page.tsx`
- `components/forms/PaymentForm.tsx`
- `lib/hooks/usePayments.ts`

---

## FR-008: Polish & Error Handling
**Branch:** `feat/frontend-polish`  
**Size:** ~200 LOC  
**Priority:** P1  
**Dependencies:** FR-005, FR-006, FR-007

### Tasks
- [ ] Add error boundaries (`app/error.tsx`)
- [ ] Add global loading state (`app/loading.tsx`)
- [ ] Implement consistent error handling in hooks
- [ ] Add 404 page (`app/not-found.tsx`)
- [ ] Add confirmation dialogs (delete, send invoice)
- [ ] Add keyboard shortcuts (optional)
- [ ] Test all pages with empty states
- [ ] Test all error cases (400, 404, 500)
- [ ] Mobile responsiveness check
- [ ] Accessibility audit (ARIA labels, keyboard nav)
- [ ] Centralize currency/date formatting with `Intl.NumberFormat`/`Intl.DateTimeFormat` helpers (support future i18n)

### Error Boundary
```tsx
// app/error.tsx
'use client';

export default function ErrorPage({ error, reset }: Props) {
  return (
    <div className="container py-16 text-center">
      <h1>Something went wrong</h1>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset} className="mt-4">Try Again</Button>
    </div>
  );
}
```

### Confirmation Dialog
```tsx
// components/ui/ConfirmDialog.tsx
export function ConfirmDialog({ title, description, onConfirm }: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Acceptance Criteria
- [ ] Error boundary catches and displays errors gracefully
- [ ] Loading states show skeletons (not blank pages)
- [ ] 404 page renders for invalid routes
- [ ] Confirmation dialogs used for destructive actions
- [ ] All pages responsive (mobile, tablet, desktop)
- [ ] Keyboard navigation works (tab order, enter to submit)
- [ ] Empty states helpful (not just "No data")
- [ ] Toast notifications clear and actionable
- [ ] Currency and date display sourced from shared formatter utilities (locale-aware)

### Files Changed
- `app/error.tsx`, `loading.tsx`, `not-found.tsx`
- `components/ui/ConfirmDialog.tsx`
- Various pages (add loading/error handling)

---

# Backend Phase (Cursor)

## Phase Overview
**Goal:** Build production-ready API with DDD/CQRS/VSA, Postgres, tests  
**Stack:** Java 17 + Spring Boot 3.2 + PostgreSQL 16  
**Timeline:** Days 3-5 (Backend PRs 9-18)  
**Dependencies:** Frontend mock API (for contract reference)

---

## BR-009: Project Setup & Spring Boot Configuration
**Branch:** `feat/backend-setup`  
**Size:** ~150 LOC  
**Priority:** P0 (Blocking)  
**Dependencies:** None

### Tasks
- [ ] Initialize Spring Boot 3.2 Maven project
- [ ] Configure `pom.xml` with dependencies:
  - Spring Web, Spring Data JPA, Spring Security
  - PostgreSQL Driver, Flyway
  - Lombok, Validation
  - Testcontainers, JUnit 5, AssertJ
  - Springdoc OpenAPI
- [ ] Create `application.yml` (dev, test profiles)
- [ ] Configure project structure (vertical slices)
- [ ] Add `.gitignore` (target/, .idea/, *.iml)
- [ ] Create README.md with setup instructions

### Project Structure
```
src/main/java/com/invoiceme/
  /customers
    /commands
    /queries
    /domain
    /infrastructure
    /api
  /invoices
    (same structure)
  /payments
    (same structure)
  /shared
    /domain (DomainEvent, BaseEntity)
    /infrastructure (config, filters)
src/main/resources/
  /db/migration (Flyway scripts)
  application.yml
src/test/java/com/invoiceme/
  (mirror main structure)
```

### application.yml
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/invoiceme_db
    username: postgres
    password: password
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  flyway:
    enabled: true
    locations: classpath:db/migration

server:
  port: 8080

management:
  endpoints:
    web:
      exposure:
        include: health,metrics
```

### Acceptance Criteria
- [ ] Project builds successfully: `mvn clean install`
- [ ] Spring Boot starts: `mvn spring-boot:run`
- [ ] Postgres connection configured (fails gracefully if DB not running)
- [ ] README includes DB setup instructions

### Files Changed
- `pom.xml`
- `src/main/resources/application.yml`, `application-test.yml`
- `src/main/java/com/invoiceme/InvoicemeApplication.java`
- `README.md`

---

## BR-010: Database Migrations & Schema
**Branch:** `feat/backend-migrations`  
**Size:** ~400 LOC (SQL)  
**Priority:** P0 (Blocking)  
**Dependencies:** BR-009

### Tasks
- [ ] Create Flyway migration scripts V0-V6
- [ ] Test migrations locally with Postgres 16
- [ ] Verify schema matches PRD Section 6
**V0__enable_extensions.sql**
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Migration Scripts

**V1__create_customers_table.sql**
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    billing_address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE customers IS 'Customer entities with soft delete support';
COMMENT ON COLUMN customers.email IS 'Email is nullable and not unique (allows shared accounting emails)';
```

**V2__create_invoices_table.sql**
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('DRAFT', 'SENT', 'PAID')),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    discount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    issued_date DATE,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
);

COMMENT ON COLUMN invoices.total IS 'Total = SUM(line_items) - discount';
COMMENT ON TABLE invoices IS 'Invoice aggregate root; balance computed dynamically';
```

**V3__create_invoice_line_items_table.sql**
```sql
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    line_total DECIMAL(10,2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_line_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

COMMENT ON COLUMN invoice_line_items.line_total IS 'Computed as quantity * unit_price';
```

**V4__create_payments_table.sql**
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(20) CHECK (payment_method IN ('Cash', 'Card', 'Wire', 'ACH', 'Check', 'Other')),
    notes TEXT,
    idempotency_key UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
    CONSTRAINT uq_payments_idempotency UNIQUE (invoice_id, idempotency_key)
);

CREATE OR REPLACE FUNCTION prevent_payment_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Payments are immutable';
END;
$$;

CREATE TRIGGER payments_prevent_update_delete
    BEFORE UPDATE OR DELETE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION prevent_payment_mutation();

COMMENT ON TABLE payments IS 'Payments are immutable once recorded';
```

**V5__create_indexes.sql**
```sql
-- Customer indexes
CREATE INDEX idx_customers_is_active ON customers(is_active);
CREATE INDEX idx_customers_email ON customers(email) WHERE email IS NOT NULL;

-- Invoice indexes
CREATE INDEX idx_invoice_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoice_status ON invoices(status);
CREATE INDEX idx_invoice_customer_status ON invoices(customer_id, status);

-- Line item index
CREATE INDEX idx_line_item_invoice_id ON invoice_line_items(invoice_id);

-- Payment indexes
CREATE INDEX idx_payment_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payment_date ON payments(payment_date);
```

**V6__create_invoice_number_counters.sql**
```sql
CREATE TABLE invoice_number_counters (
    year INTEGER PRIMARY KEY,
    last_value BIGINT NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION next_invoice_sequence(p_year INTEGER)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    current_value BIGINT;
BEGIN
    INSERT INTO invoice_number_counters(year, last_value)
    VALUES (p_year, 0)
    ON CONFLICT (year)
    DO NOTHING;

    UPDATE invoice_number_counters
       SET last_value = last_value + 1
     WHERE year = p_year
     RETURNING last_value INTO current_value;

    RETURN current_value;
END;
$$;

COMMENT ON TABLE invoice_number_counters IS 'Keeps per-year counters for invoice numbers';
```

### Acceptance Criteria
- [ ] Flyway migrations run successfully
- [ ] Schema matches PRD data model
- [ ] All constraints (PK, FK, CHECK, UNIQUE) present
- [ ] Indexes created on foreign keys and filter columns
- [ ] Comments added to tables/columns for documentation
- [ ] Required extensions enabled (pgcrypto) via V0 migration
- [ ] Payments table enforces immutability and unique `(invoice_id, idempotency_key)`
- [ ] Invoice number counters reset per year via transactional function
- [ ] `mvn flyway:migrate` succeeds
- [ ] `mvn flyway:clean` and re-migrate succeeds

### Files Changed
- `src/main/resources/db/migration/V1__create_customers_table.sql` (through V6)

---

## BR-011: Shared Infrastructure & Security
**Branch:** `feat/backend-shared-infra`  
**Size:** ~250 LOC  
**Priority:** P0 (Blocking)  
**Dependencies:** BR-009, BR-010

### Tasks
- [ ] Create base entities (`BaseEntity`, `AuditableEntity`)
- [ ] Create API Key authentication filter
- [ ] Configure Spring Security
- [ ] Create global exception handler + `@ControllerAdvice` that wraps all errors in the `{ error: { code, message, timestamp } }` envelope
- [ ] Create standard error response DTOs and reuse them in the API Key filter
- [ ] Configure CORS (allow frontend origin only, credentials-ready)

### Base Entity
```java
// shared/domain/BaseEntity.java
@MappedSuperclass
@Getter
@Setter
public abstract class BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
}
```

### Auditable Entity
```java
// shared/domain/AuditableEntity.java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public abstract class AuditableEntity extends BaseEntity {
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
    
    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;
}
```

### API Key Filter
```java
// shared/infrastructure/ApiKeyAuthFilter.java
@Component
public class ApiKeyAuthFilter extends OncePerRequestFilter {
    private static final String API_KEY_HEADER = "X-API-Key";
    private static final String VALID_API_KEY = "demo-api-key-12345";
    private final ObjectMapper objectMapper;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                     HttpServletResponse response, 
                                     FilterChain filterChain) throws ServletException, IOException {
        String apiKey = request.getHeader(API_KEY_HEADER);
        
        if (!VALID_API_KEY.equals(apiKey)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            ErrorEnvelope body = ErrorEnvelope.of("INVALID_API_KEY", "Invalid or missing API Key");
            response.getWriter().write(objectMapper.writeValueAsString(body));
            return;
        }
        
        // Set authentication in context
        ApiKeyAuthentication auth = new ApiKeyAuthentication(apiKey, true);
        SecurityContextHolder.getContext().setAuthentication(auth);
        
        filterChain.doFilter(request, response);
    }
}
```

### Security Config
```java
// shared/infrastructure/SecurityConfig.java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private final ApiKeyAuthFilter apiKeyAuthFilter;
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/api/**").authenticated()
            )
            .addFilterBefore(apiKeyAuthFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

### Global Exception Handler
```java
// shared/infrastructure/GlobalExceptionHandler.java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorEnvelope> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ErrorEnvelope.of("NOT_FOUND", ex.getMessage()));
    }
    
    @ExceptionHandler(InvalidStateException.class)
    public ResponseEntity<ErrorEnvelope> handleInvalidState(InvalidStateException ex) {
        return ResponseEntity.badRequest()
            .body(ErrorEnvelope.of("INVALID_STATE", ex.getMessage()));
    }
    
    @ExceptionHandler(OverpaymentException.class)
    public ResponseEntity<ErrorEnvelope> handleOverpayment(OverpaymentException ex) {
        return ResponseEntity.badRequest()
            .body(ErrorEnvelope.of("OVERPAYMENT", ex.getMessage()));
    }
    
    @ExceptionHandler(DuplicatePaymentException.class)
    public ResponseEntity<ErrorEnvelope> handleDuplicatePayment(DuplicatePaymentException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ErrorEnvelope.of("DUPLICATE_PAYMENT", ex.getMessage()));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorEnvelope> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getAllErrors().stream()
            .map(DefaultMessageSourceResolvable::getDefaultMessage)
            .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest()
            .body(ErrorEnvelope.of("VALIDATION_ERROR", message));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorEnvelope> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorEnvelope.of("INTERNAL_ERROR", "An unexpected error occurred"));
    }
}

// shared/infrastructure/ErrorEnvelope.java
public record ErrorEnvelope(ErrorBody error) {
    public static ErrorEnvelope of(String code, String message) {
        return new ErrorEnvelope(new ErrorBody(code, message, Instant.now()));
    }
    
    public record ErrorBody(String code, String message, Instant timestamp) {}
}
```

### Acceptance Criteria
- [ ] API Key filter validates `X-API-Key` header
- [ ] Invalid/missing key returns 401 with the standard error envelope
- [ ] Global exception handler + response advice wrap all errors
- [ ] Error responses follow the `{ error: { code, message, timestamp } }` contract
- [ ] CORS configured for http://localhost:3000
- [ ] Actuator endpoints publicly accessible (/actuator/health)

### Files Changed
- `shared/domain/BaseEntity.java`, `AuditableEntity.java`
- `shared/infrastructure/ApiKeyAuthFilter.java`, `ApiKeyAuthentication.java`
- `shared/infrastructure/SecurityConfig.java`
- `shared/infrastructure/GlobalExceptionHandler.java`
- `shared/infrastructure/CorsConfig.java`

---

## BR-012: Customer Vertical Slice
**Branch:** `feat/backend-customers`  
**Size:** ~600 LOC  
**Priority:** P0  
**Dependencies:** BR-011

### Tasks
- [ ] Create Customer domain entity
- [ ] Create CustomerRepository interface
- [ ] Implement JPA repository and mapper
- [ ] Create commands: CreateCustomer, UpdateCustomer, DeactivateCustomer
- [ ] Create command handlers
- [ ] Create queries: GetCustomerById, ListCustomers
- [ ] Create query handlers
- [ ] Create REST controller with 5 endpoints
- [ ] Create DTOs (CustomerDTO, CreateCustomerRequest, UpdateCustomerRequest)
- [ ] Write unit tests for domain logic
- [ ] Keep handlers lightweight but meaningful (each handler should enforce invariants beyond simple repository calls)

### Domain Entity
```java
// customers/domain/Customer.java
@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
public class Customer extends AuditableEntity {
    
    @Column(nullable = false)
    private String name;
    
    @Column
    private String email;
    
    @Column(name = "billing_address")
    private String billingAddress;
    
    @Column(nullable = false, name = "is_active")
    private Boolean isActive = true;
    
    public Customer(String name, String email, String billingAddress) {
        this.name = name;
        this.email = email;
        this.billingAddress = billingAddress;
        this.isActive = true;
    }
    
    public void update(String name, String email, String billingAddress) {
        this.name = name;
        this.email = email;
        this.billingAddress = billingAddress;
    }
    
    public void deactivate() {
        this.isActive = false;
    }
}
```

### Commands
```java
// customers/commands/CreateCustomerCommand.java
public record CreateCustomerCommand(
    @NotBlank String name,
    @Email String email,
    String billingAddress
) {}

@Service
@RequiredArgsConstructor
public class CreateCustomerCommandHandler {
    private final CustomerRepository repository;
    
    public UUID handle(CreateCustomerCommand command) {
        Customer customer = new Customer(
            command.name(),
            command.email(),
            command.billingAddress()
        );
        
        Customer saved = repository.save(customer);
        return saved.getId();
    }
}
```

### Queries
```java
// customers/queries/GetCustomerByIdQuery.java
public record GetCustomerByIdQuery(UUID id) {}

@Service
@RequiredArgsConstructor
public class GetCustomerByIdQueryHandler {
    private final CustomerRepository repository;
    
    public CustomerDTO handle(GetCustomerByIdQuery query) {
        Customer customer = repository.findById(query.id())
            .orElseThrow(() -> new EntityNotFoundException("Customer not found"));
        
        return CustomerMapper.toDTO(customer);
    }
}
```

### REST Controller
```java
// customers/api/CustomerController.java
@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {
    private final CreateCustomerCommandHandler createHandler;
    private final UpdateCustomerCommandHandler updateHandler;
    private final DeactivateCustomerCommandHandler deactivateHandler;
    private final GetCustomerByIdQueryHandler getByIdHandler;
    private final ListCustomersQueryHandler listHandler;
    
    @GetMapping
    public Page<CustomerDTO> listCustomers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "false") boolean includeInactive
    ) {
        return listHandler.handle(new ListCustomersQuery(page, size, includeInactive));
    }
    
    @PostMapping
    public ResponseEntity<CustomerDTO> createCustomer(@Valid @RequestBody CreateCustomerRequest request) {
        UUID id = createHandler.handle(new CreateCustomerCommand(
            request.name(),
            request.email(),
            request.billingAddress()
        ));
        
        CustomerDTO dto = getByIdHandler.handle(new GetCustomerByIdQuery(id));
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }
    
    @GetMapping("/{id}")
    public CustomerDTO getCustomer(@PathVariable UUID id) {
        return getByIdHandler.handle(new GetCustomerByIdQuery(id));
    }
    
    @PutMapping("/{id}")
    public CustomerDTO updateCustomer(@PathVariable UUID id, @Valid @RequestBody UpdateCustomerRequest request) {
        updateHandler.handle(new UpdateCustomerCommand(id, request.name(), request.email(), request.billingAddress()));
        return getByIdHandler.handle(new GetCustomerByIdQuery(id));
    }
    
    @PutMapping("/{id}/deactivate")
    public CustomerDTO deactivateCustomer(@PathVariable UUID id) {
        deactivateHandler.handle(new DeactivateCustomerCommand(id));
        return getByIdHandler.handle(new GetCustomerByIdQuery(id));
    }
}
```

### Acceptance Criteria
- [ ] All CRUD endpoints functional
- [ ] Deactivation sets `is_active = false`
- [ ] List query filters by `is_active = true` by default
- [ ] Pagination works correctly
- [ ] API response includes pagination metadata consistent with OpenAPI contract
- [ ] Email validation works (returns 400 for invalid email)
- [ ] Unit tests for domain methods (update, deactivate)
- [ ] Returns 404 for non-existent customer ID
- [ ] Decision on reactivation documented (endpoint provided or rationale in DECISIONS.md)

### Files Changed
- `customers/domain/Customer.java`, `CustomerRepository.java`
- `customers/infrastructure/CustomerJpaRepository.java`, `CustomerMapper.java`
- `customers/commands/CreateCustomerCommand.java`, `CreateCustomerCommandHandler.java` (x3)
- `customers/queries/GetCustomerByIdQuery.java`, `GetCustomerByIdQueryHandler.java` (x2)
- `customers/api/CustomerController.java`, `CustomerDTO.java`, `CreateCustomerRequest.java`, `UpdateCustomerRequest.java`
- `customers/CustomerTest.java` (unit tests)

---

## BR-013: Invoice Vertical Slice (Part 1: CRUD)
**Branch:** `feat/backend-invoices-crud`  
**Size:** ~700 LOC  
**Priority:** P0  
**Dependencies:** BR-012

### Tasks
- [ ] Create Invoice and InvoiceLineItem domain entities
- [ ] Implement invoice number generator (INV-YYYY-NNNN)
- [ ] Create InvoiceRepository interface
- [ ] Implement JPA repository with @EntityGraph for line items
- [ ] Create commands: CreateInvoice, UpdateInvoice
- [ ] Create command handlers
- [ ] Create queries: GetInvoiceById, ListInvoices
- [ ] Create query handlers with balance calculation
- [ ] Create REST controller
- [ ] Create DTOs
- [ ] Add @Version for optimistic locking

### Domain Entity
```java
// invoices/domain/Invoice.java
@Entity
@Table(name = "invoices")
@Getter
@Setter
@NoArgsConstructor
public class Invoice extends AuditableEntity {
    
    private static final RoundingMode MONEY_ROUNDING = RoundingMode.HALF_EVEN;
    
    @Column(name = "customer_id", nullable = false)
    private UUID customerId;
    
    @Column(name = "invoice_number", nullable = false, unique = true)
    private String invoiceNumber;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status = InvoiceStatus.DRAFT;
    
    @Column(nullable = false)
    private BigDecimal total = BigDecimal.ZERO;
    
    @Column(nullable = false)
    private BigDecimal discount = BigDecimal.ZERO;
    
    @Column(name = "issued_date")
    private LocalDate issuedDate;
    
    @Column(name = "due_date")
    private LocalDate dueDate;
    
    @Column
    private String notes;
    
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InvoiceLineItem> lineItems = new ArrayList<>();
    
    @Version
    private Long version;  // Optimistic locking
    
    // Business logic methods
    
    public void addLineItem(InvoiceLineItem item) {
        lineItems.add(item);
        item.setInvoice(this);
        recalculateTotal();
    }
    
    public void updateLineItems(List<InvoiceLineItem> newItems) {
        if (status != InvoiceStatus.DRAFT) {
            throw new InvalidStateException("Cannot edit line items after invoice is sent");
        }
        lineItems.clear();
        newItems.forEach(this::addLineItem);
    }
    
    public void applyDiscount(BigDecimal discount) {
        if (discount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Discount cannot be negative");
        }
        this.discount = discount.setScale(2, MONEY_ROUNDING);
        recalculateTotal();
    }
    
    private void recalculateTotal() {
        BigDecimal subtotal = lineItems.stream()
            .map(InvoiceLineItem::getLineTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, MONEY_ROUNDING);
        this.total = subtotal.subtract(discount, MathContext.DECIMAL64).setScale(2, MONEY_ROUNDING);
    }
    
    @Transient
    public BigDecimal getBalance(List<Payment> payments) {
        BigDecimal totalPaid = payments.stream()
            .map(Payment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.subtract(totalPaid, MathContext.DECIMAL64).setScale(2, MONEY_ROUNDING);
    }
}

enum InvoiceStatus {
    DRAFT, SENT, PAID
}
```

### Line Item Entity
```java
// invoices/domain/InvoiceLineItem.java
@Entity
@Table(name = "invoice_line_items")
@Getter
@Setter
@NoArgsConstructor
public class InvoiceLineItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;
    
    @Column(nullable = false)
    private String description;
    
    @Column(nullable = false)
    private BigDecimal quantity;
    
    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;
    
    @Column(name = "line_total", nullable = false)
    private BigDecimal lineTotal;
    
    @CreatedDate
    @Column(nullable = false, updatable = false, name = "created_at")
    private Instant createdAt;
    
    public InvoiceLineItem(String description, BigDecimal quantity, BigDecimal unitPrice) {
        this.description = description;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.lineTotal = quantity.multiply(unitPrice, MathContext.DECIMAL64).setScale(2, RoundingMode.HALF_EVEN);
    }
}
```

### Invoice Number Generator
```java
// invoices/domain/InvoiceNumberGenerator.java
@Service
public class InvoiceNumberGenerator {
    private final JdbcTemplate jdbcTemplate;
    
    public String generateNext() {
        int year = LocalDate.now().getYear();
        Long sequence = jdbcTemplate.queryForObject(
            "SELECT next_invoice_sequence(?)",
            Long.class,
            year
        );
        
        return String.format("INV-%d-%04d", year, sequence);
    }
}
```

### Create Invoice Command
```java
// invoices/commands/CreateInvoiceCommand.java
public record CreateInvoiceCommand(
    @NotNull UUID customerId,
    @NotEmpty List<LineItemData> lineItems,
    BigDecimal discount,
    String notes,
    LocalDate dueDate
) {}

public record LineItemData(
    @NotBlank String description,
    @NotNull @Positive BigDecimal quantity,
    @NotNull @PositiveOrZero BigDecimal unitPrice
) {}

@Service
@RequiredArgsConstructor
@Transactional
public class CreateInvoiceCommandHandler {
    private final InvoiceRepository repository;
    private final InvoiceNumberGenerator numberGenerator;
    
    public UUID handle(CreateInvoiceCommand command) {
        Invoice invoice = new Invoice();
        invoice.setCustomerId(command.customerId());
        invoice.setInvoiceNumber(numberGenerator.generateNext());
        invoice.setNotes(command.notes());
        invoice.setDueDate(command.dueDate());
        
        // Add line items
        command.lineItems().forEach(itemData -> {
            InvoiceLineItem item = new InvoiceLineItem(
                itemData.description(),
                itemData.quantity(),
                itemData.unitPrice()
            );
            invoice.addLineItem(item);
        });
        
        // Apply discount if provided
        if (command.discount() != null) {
            invoice.applyDiscount(command.discount());
        }
        
        Invoice saved = repository.save(invoice);
        return saved.getId();
    }
}
```

### Repository with EntityGraph
```java
// invoices/infrastructure/InvoiceJpaRepository.java
public interface InvoiceJpaRepository extends JpaRepository<Invoice, UUID> {
    
    @EntityGraph(attributePaths = {"lineItems"})
    Optional<Invoice> findByIdWithLineItems(UUID id);
    
    @Query("SELECT i FROM Invoice i WHERE (:status IS NULL OR i.status = :status) " +
           "AND (:customerId IS NULL OR i.customerId = :customerId)")
    Page<Invoice> findByFilters(@Param("status") InvoiceStatus status,
                                  @Param("customerId") UUID customerId,
                                  Pageable pageable);
}
```

### Acceptance Criteria
- [ ] Invoice creation generates unique invoice number (INV-YYYY-NNNN)
- [ ] Invoice number sequence resets per year and is safe under concurrent transactions
- [ ] Line items cascade saved with invoice
- [ ] Total auto-calculated: SUM(line_items) - discount
- [ ] Update command validates status = DRAFT
- [ ] N+1 query prevention with @EntityGraph
- [ ] Optimistic locking works (@Version increments)
- [ ] List query supports status and customerId filters
- [ ] Returns 400 when trying to edit SENT invoice
- [ ] Lifecycle docs clarify whether invoices can be voided/deactivated (and expose endpoint if yes)
- [ ] List response returns pagination metadata consistent with frontend contract

### Files Changed
- `invoices/domain/Invoice.java`, `InvoiceLineItem.java`, `InvoiceStatus.java`, `InvoiceNumberGenerator.java`
- `invoices/infrastructure/InvoiceJpaRepository.java`, `InvoiceMapper.java`
- `invoices/commands/CreateInvoiceCommand.java`, `CreateInvoiceCommandHandler.java`, `UpdateInvoiceCommand.java`, `UpdateInvoiceCommandHandler.java`
- `invoices/queries/GetInvoiceByIdQuery.java`, `GetInvoiceByIdQueryHandler.java`, `ListInvoicesQuery.java`, `ListInvoicesQueryHandler.java`
- `invoices/api/InvoiceController.java`, `InvoiceDTO.java`, `CreateInvoiceRequest.java`, `UpdateInvoiceRequest.java`

---

## BR-014: Invoice Vertical Slice (Part 2: Lifecycle)
**Branch:** `feat/backend-invoices-lifecycle`  
**Size:** ~300 LOC  
**Priority:** P0  
**Dependencies:** BR-013

### Tasks
- [ ] Add `markAsSent()` domain method
- [ ] Create MarkInvoiceAsSentCommand
- [ ] Create command handler
- [ ] Add POST `/api/invoices/{id}/send` endpoint
- [ ] Add validation: at least 1 line item required
- [ ] Create domain events (optional): InvoiceSentEvent
- [ ] Write unit tests for lifecycle transitions

### Domain Method
```java
// invoices/domain/Invoice.java (add method)
public void markAsSent() {
    if (status != InvoiceStatus.DRAFT) {
        throw new InvalidStateException("Invoice must be in DRAFT status to mark as sent");
    }
    if (lineItems.isEmpty()) {
        throw new InvalidStateException("Invoice must have at least one line item");
    }
    
    this.status = InvoiceStatus.SENT;
    this.issuedDate = LocalDate.now();
    
    // Optional: Publish domain event
    // DomainEvents.raise(new InvoiceSentEvent(this.id));
}
```

### Command
```java
// invoices/commands/MarkInvoiceAsSentCommand.java
public record MarkInvoiceAsSentCommand(UUID invoiceId) {}

@Service
@RequiredArgsConstructor
@Transactional
public class MarkInvoiceAsSentCommandHandler {
    private final InvoiceRepository repository;
    
    public void handle(MarkInvoiceAsSentCommand command) {
        Invoice invoice = repository.findById(command.invoiceId())
            .orElseThrow(() -> new EntityNotFoundException("Invoice not found"));
        
        invoice.markAsSent();
        
        repository.save(invoice);
    }
}
```

### Controller Endpoint
```java
// invoices/api/InvoiceController.java (add endpoint)
@PostMapping("/{id}/send")
public InvoiceDTO sendInvoice(@PathVariable UUID id) {
    sendInvoiceHandler.handle(new MarkInvoiceAsSentCommand(id));
    return getByIdHandler.handle(new GetInvoiceByIdQuery(id));
}
```

### Acceptance Criteria
- [ ] `markAsSent()` validates status = DRAFT
- [ ] Validation requires ≥1 line item
- [ ] Status changes to SENT
- [ ] `issuedDate` set to current date
- [ ] Returns 400 if validation fails
- [ ] Unit test: DRAFT → SENT succeeds
- [ ] Unit test: SENT → SENT fails

### Files Changed
- `invoices/domain/Invoice.java`
- `invoices/commands/MarkInvoiceAsSentCommand.java`, `MarkInvoiceAsSentCommandHandler.java`
- `invoices/api/InvoiceController.java`
- `invoices/InvoiceTest.java` (unit tests)

---

## BR-015: Payment Vertical Slice
**Branch:** `feat/backend-payments`  
**Size:** ~600 LOC  
**Priority:** P0  
**Dependencies:** BR-014

### Tasks
- [ ] Create Payment domain entity
- [ ] Create PaymentRepository interface
- [ ] Add repository method to check `(invoiceId, idempotencyKey)` uniqueness
- [ ] Create RecordPaymentCommand with validation
- [ ] Implement command handler with:
  - Overpayment validation
  - Invoice balance update
  - Auto-mark invoice as PAID when balance = 0
- [ ] Create queries: GetPaymentById, ListPaymentsForInvoice
- [ ] Create REST controller
- [ ] Add @Transactional for atomicity (payment + invoice update)

### Domain Entity
```java
// payments/domain/Payment.java
@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
public class Payment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "invoice_id", nullable = false)
    private UUID invoiceId;
    
    @Column(nullable = false)
    private BigDecimal amount;
    
    @Column(name = "payment_date", nullable = false)
    private Instant paymentDate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    private PaymentMethod paymentMethod;
    
    @Column
    private String notes;
    
    @CreatedDate
    @Column(nullable = false, updatable = false, name = "created_at")
    private Instant createdAt;
    
    @Column(name = "idempotency_key", nullable = false)
    private UUID idempotencyKey;
    
    public Payment(UUID invoiceId, BigDecimal amount, PaymentMethod paymentMethod, String notes, UUID idempotencyKey) {
        this.invoiceId = invoiceId;
        this.amount = amount.setScale(2, RoundingMode.HALF_EVEN);
        this.paymentMethod = paymentMethod;
        this.notes = notes;
        this.paymentDate = Instant.now();
        this.idempotencyKey = idempotencyKey;
    }
}

enum PaymentMethod {
    Cash, Card, Wire, ACH, Check, Other
}
```

### Repository
```java
// payments/infrastructure/PaymentJpaRepository.java
public interface PaymentJpaRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByInvoiceId(UUID invoiceId);
    Optional<Payment> findByInvoiceIdAndIdempotencyKey(UUID invoiceId, UUID idempotencyKey);
}
```

### Record Payment Command
```java
// payments/commands/RecordPaymentCommand.java
public record RecordPaymentCommand(
    @NotNull UUID invoiceId,
    @NotNull @Positive BigDecimal amount,
    PaymentMethod paymentMethod,
    String notes,
    @NotNull UUID idempotencyKey
) {}

@Service
@RequiredArgsConstructor
@Transactional
public class RecordPaymentCommandHandler {
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    
    public UUID handle(RecordPaymentCommand command) {
        // 1. Load invoice with payments
        Invoice invoice = invoiceRepository.findByIdWithLineItems(command.invoiceId())
            .orElseThrow(() -> new EntityNotFoundException("Invoice not found"));
        
        // 2. Validate invoice status
        if (invoice.getStatus() == InvoiceStatus.DRAFT) {
            throw new InvalidStateException("Cannot record payment for DRAFT invoice");
        }
        
        // 3. Load existing payments
        List<Payment> existingPayments = paymentRepository.findByInvoiceId(command.invoiceId());
        
        // 4. Calculate current balance
        BigDecimal balance = invoice.getBalance(existingPayments);
        
        // 5. Validate no overpayment
        if (command.amount().compareTo(balance) > 0) {
            throw new OverpaymentException(
                "Payment amount exceeds invoice balance. Balance: " + balance
            );
        }
        
        // 6. Create and save payment
        paymentRepository.findByInvoiceIdAndIdempotencyKey(command.invoiceId(), command.idempotencyKey())
            .ifPresent(existing -> {
                throw new DuplicatePaymentException(existing.getId());
            });
        
        Payment payment = new Payment(
            command.invoiceId(),
            command.amount(),
            command.paymentMethod(),
            command.notes(),
            command.idempotencyKey()
        );
        Payment saved = paymentRepository.save(payment);
        
        // 7. Update invoice status if fully paid
        BigDecimal newBalance = balance.subtract(command.amount());
        if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setStatus(InvoiceStatus.PAID);
            invoiceRepository.save(invoice);
        }
        
        return saved.getId();
    }
}

class OverpaymentException extends RuntimeException {
    public OverpaymentException(String message) {
        super(message);
    }
}

class DuplicatePaymentException extends RuntimeException {
    public DuplicatePaymentException(UUID paymentId) {
        super("Duplicate payment submission (id=" + paymentId + ")");
    }
}
```

### Controller
```java
// payments/api/PaymentController.java
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final RecordPaymentCommandHandler recordHandler;
    private final GetPaymentByIdQueryHandler getByIdHandler;
    
    @PostMapping
    public ResponseEntity<PaymentDTO> recordPayment(@Valid @RequestBody CreatePaymentRequest request) {
        UUID id = recordHandler.handle(new RecordPaymentCommand(
            request.invoiceId(),
            request.amount(),
            request.paymentMethod(),
            request.notes()
        ));
        
        PaymentDTO dto = getByIdHandler.handle(new GetPaymentByIdQuery(id));
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }
    
    @GetMapping("/{id}")
    public PaymentDTO getPayment(@PathVariable UUID id) {
        return getByIdHandler.handle(new GetPaymentByIdQuery(id));
    }
}

// Also add to InvoiceController:
@GetMapping("/{id}/payments")
public List<PaymentDTO> getInvoicePayments(@PathVariable UUID id) {
    return listPaymentsHandler.handle(new ListPaymentsForInvoiceQuery(id));
}
```

### Acceptance Criteria
- [ ] Payment recorded successfully
- [ ] Overpayment rejected with 400 error
- [ ] Invoice status updates to PAID when balance = 0
- [ ] Partial payments supported (status remains SENT)
- [ ] Payment date auto-set to current timestamp
- [ ] Transaction atomic (payment + invoice update)
- [ ] Returns 404 if invoice not found
- [ ] Returns 400 if invoice status = DRAFT
- [ ] Duplicate idempotency keys return 409 and do not create new payments
- [ ] Payments remain immutable (DB trigger prevents update/delete)

### Files Changed
- `payments/domain/Payment.java`, `PaymentMethod.java`, `PaymentRepository.java`
- `payments/infrastructure/PaymentJpaRepository.java`, `PaymentMapper.java`
- `payments/commands/RecordPaymentCommand.java`, `RecordPaymentCommandHandler.java`
- `payments/queries/GetPaymentByIdQuery.java`, `GetPaymentByIdQueryHandler.java`, `ListPaymentsForInvoiceQuery.java`, `ListPaymentsForInvoiceQueryHandler.java`
- `payments/api/PaymentController.java`, `PaymentDTO.java`, `CreatePaymentRequest.java`
- `shared/infrastructure/GlobalExceptionHandler.java` (add OverpaymentException handler)

---

## BR-016: Integration Tests (Testcontainers)
**Branch:** `feat/backend-integration-tests`  
**Size:** ~800 LOC  
**Priority:** P0  
**Dependencies:** BR-015

### Tasks
- [ ] Set up Testcontainers base class
- [ ] Create CustomerIntegrationTest (CRUD operations)
- [ ] Create InvoiceIntegrationTest (CRUD + lifecycle)
- [ ] Create PaymentIntegrationTest (record payment, overpayment validation)
- [ ] Create InvoicePaymentFlowIntegrationTest (end-to-end)
- [ ] Add concurrency test to verify optimistic locking on invoice updates
- [ ] Add double-submit test to confirm payment idempotency and overpayment rounding safeguards
- [ ] Configure test application.yml
- [ ] Achieve ≥70% coverage for commands/queries

### Base Test Class
```java
// BaseIntegrationTest.java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("invoiceme_test")
        .withUsername("test")
        .withPassword("test");
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
    
    @Autowired
    protected TestRestTemplate restTemplate;
    
    @BeforeEach
    void setUp() {
        // Clean database or use @DirtiesContext
    }
    
    protected HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-API-Key", "demo-api-key-12345");
        return headers;
    }
}
```

### End-to-End Flow Test
```java
// InvoicePaymentFlowIntegrationTest.java
@SpringBootTest
class InvoicePaymentFlowIntegrationTest extends BaseIntegrationTest {
    
    @Test
    void shouldCompleteInvoicePaymentFlow() {
        // 1. Create customer
        CreateCustomerRequest customerReq = new CreateCustomerRequest("Acme Corp", "billing@acme.com", null);
        ResponseEntity<CustomerDTO> customerRes = restTemplate.postForEntity(
            "/api/customers", 
            new HttpEntity<>(customerReq, authHeaders()), 
            CustomerDTO.class
        );
        assertThat(customerRes.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        UUID customerId = customerRes.getBody().id();
        
        // 2. Create invoice with 2 line items (total $1000)
        CreateInvoiceRequest invoiceReq = new CreateInvoiceRequest(
            customerId,
            List.of(
                new LineItemData("Service A", BigDecimal.valueOf(1), BigDecimal.valueOf(500)),
                new LineItemData("Service B", BigDecimal.valueOf(1), BigDecimal.valueOf(500))
            ),
            BigDecimal.ZERO,
            null,
            null
        );
        ResponseEntity<InvoiceDTO> invoiceRes = restTemplate.postForEntity(
            "/api/invoices",
            new HttpEntity<>(invoiceReq, authHeaders()),
            InvoiceDTO.class
        );
        assertThat(invoiceRes.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        InvoiceDTO invoice = invoiceRes.getBody();
        assertThat(invoice.status()).isEqualTo("DRAFT");
        assertThat(invoice.total()).isEqualByComparingTo(BigDecimal.valueOf(1000));
        assertThat(invoice.balance()).isEqualByComparingTo(BigDecimal.valueOf(1000));
        
        // 3. Mark invoice as sent
        ResponseEntity<InvoiceDTO> sendRes = restTemplate.postForEntity(
            "/api/invoices/" + invoice.id() + "/send",
            new HttpEntity<>(null, authHeaders()),
            InvoiceDTO.class
        );
        assertThat(sendRes.getBody().status()).isEqualTo("SENT");
        assertThat(sendRes.getBody().issuedDate()).isNotNull();
        
        // 4. Record partial payment ($400)
        CreatePaymentRequest payment1 = new CreatePaymentRequest(
            invoice.id(),
            BigDecimal.valueOf(400),
            PaymentMethod.Wire,
            "Partial payment 1"
        );
        ResponseEntity<PaymentDTO> payment1Res = restTemplate.postForEntity(
            "/api/payments",
            new HttpEntity<>(payment1, authHeaders()),
            PaymentDTO.class
        );
        assertThat(payment1Res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        
        // 5. Verify balance updated to $600, status still SENT
        ResponseEntity<InvoiceDTO> afterPayment1 = restTemplate.exchange(
            "/api/invoices/" + invoice.id(),
            HttpMethod.GET,
            new HttpEntity<>(authHeaders()),
            InvoiceDTO.class
        );
        assertThat(afterPayment1.getBody().balance()).isEqualByComparingTo(BigDecimal.valueOf(600));
        assertThat(afterPayment1.getBody().status()).isEqualTo("SENT");
        
        // 6. Record remaining payment ($600)
        CreatePaymentRequest payment2 = new CreatePaymentRequest(
            invoice.id(),
            BigDecimal.valueOf(600),
            PaymentMethod.Check,
            "Final payment"
        );
        restTemplate.postForEntity("/api/payments", new HttpEntity<>(payment2, authHeaders()), PaymentDTO.class);
        
        // 7. Verify balance = $0, status = PAID
        ResponseEntity<InvoiceDTO> afterPayment2 = restTemplate.exchange(
            "/api/invoices/" + invoice.id(),
            HttpMethod.GET,
            new HttpEntity<>(authHeaders()),
            InvoiceDTO.class
        );
        assertThat(afterPayment2.getBody().balance()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(afterPayment2.getBody().status()).isEqualTo("PAID");
    }
    
    @Test
    void shouldRejectOverpayment() {
        // Setup: Create customer, invoice, send it
        // ... (similar to above)
        
        // Attempt to record payment exceeding balance
        CreatePaymentRequest overpayment = new CreatePaymentRequest(
            invoice.id(),
            BigDecimal.valueOf(1500),  // Invoice total is $1000
            PaymentMethod.Wire,
            "Overpayment attempt"
        );
        
        ResponseEntity<String> res = restTemplate.postForEntity(
            "/api/payments",
            new HttpEntity<>(overpayment, authHeaders()),
            String.class
        );
        
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody()).contains("exceeds invoice balance");
    }
}
```

### Acceptance Criteria
- [ ] All integration tests pass
- [ ] Testcontainers spins up Postgres successfully
- [ ] End-to-end flow test covers: create customer → invoice → send → partial payment → final payment
- [ ] Overpayment test verifies 400 error
- [ ] Invoice edit after SENT test verifies 400 error
- [ ] Optimistic locking conflict test returns 409/appropriate error envelope
- [ ] Concurrency test ensures second payment attempt with same idempotency key is rejected cleanly
- [ ] Code coverage ≥70% for commands/queries
- [ ] Tests run in CI (or locally) with `mvn verify`

### Files Changed
- `src/test/java/com/invoiceme/BaseIntegrationTest.java`
- `src/test/java/com/invoiceme/customers/CustomerIntegrationTest.java`
- `src/test/java/com/invoiceme/invoices/InvoiceIntegrationTest.java`
- `src/test/java/com/invoiceme/payments/PaymentIntegrationTest.java`
- `src/test/java/com/invoiceme/InvoicePaymentFlowIntegrationTest.java`
- `src/test/resources/application-test.yml`

---

## BR-017: OpenAPI Documentation
**Branch:** `feat/backend-openapi`  
**Size:** ~150 LOC (annotations)  
**Priority:** P1  
**Dependencies:** BR-011 (must land before frontend integration work)

### Tasks
- [ ] Add Springdoc dependency to pom.xml
- [ ] Configure OpenAPI in application.yml
- [ ] Add @Tag annotations to controllers
- [ ] Add @Operation annotations to endpoints
- [ ] Add @Schema annotations to DTOs
- [ ] Generate openapi.yaml
- [ ] Test Swagger UI at /swagger-ui.html
- [ ] Publish OpenAPI spec to `schema/openapi.yaml` and wire `npm run generate:types` consumer

### Configuration
```yaml
# application.yml
springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html
    enabled: true
```

### Controller Annotations
```java
// customers/api/CustomerController.java
@RestController
@RequestMapping("/api/customers")
@Tag(name = "Customers", description = "Customer management APIs")
@RequiredArgsConstructor
public class CustomerController {
    
    @GetMapping
    @Operation(summary = "List customers", description = "Get paginated list of customers")
    @ApiResponse(responseCode = "200", description = "Customers retrieved successfully")
    public Page<CustomerDTO> listCustomers(...) { ... }
    
    @PostMapping
    @Operation(summary = "Create customer", description = "Create a new customer")
    @ApiResponse(responseCode = "201", description = "Customer created")
    @ApiResponse(responseCode = "400", description = "Invalid input")
    public ResponseEntity<CustomerDTO> createCustomer(...) { ... }
}
```

### DTO Annotations
```java
// customers/api/CustomerDTO.java
public record CustomerDTO(
    @Schema(description = "Customer unique identifier", example = "a1b2c3d4-...")
    UUID id,
    
    @Schema(description = "Customer name", example = "Acme Corp", required = true)
    String name,
    
    @Schema(description = "Customer email address", example = "billing@acme.com")
    String email,
    
    @Schema(description = "Billing address")
    String billingAddress,
    
    @Schema(description = "Customer active status")
    Boolean isActive
) {}
```

### Acceptance Criteria
- [ ] Swagger UI accessible at http://localhost:8080/swagger-ui.html
- [ ] All endpoints documented with descriptions
- [ ] Request/response schemas visible
- [ ] "Try it out" functionality works
- [ ] `openapi.yaml` generated, committed, and consumed by frontend type generation

### Files Changed
- `pom.xml` (add springdoc dependency)
- `application.yml` (springdoc config)
- All controllers (add @Tag, @Operation, @ApiResponse)
- All DTOs (add @Schema)
- `openapi.yaml` (generated, committed)

---

## BR-018: Performance Optimization
**Branch:** `feat/backend-performance`  
**Size:** ~200 LOC  
**Priority:** P1  
**Dependencies:** BR-016

### Tasks
- [ ] Add Hibernate SQL logging (development only)
- [ ] Verify N+1 queries eliminated with @EntityGraph
- [ ] Configure HikariCP connection pool
- [ ] Add performance assertions in integration tests
- [ ] Create PerformanceTest class with StopWatch
- [ ] Optimize invoice query with JOIN FETCH

### HikariCP Configuration
```yaml
# application.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
```

### Hibernate SQL Logging (Dev Only)
```yaml
# application-dev.yml
spring:
  jpa:
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        use_sql_comments: true
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

### Performance Test
```java
// PerformanceTest.java
@SpringBootTest
class PerformanceTest extends BaseIntegrationTest {
    
    @Test
    void getCustomerByIdShouldBeUnder50ms() {
        // Setup: Create customer
        UUID customerId = createTestCustomer();
        
        // Warm up
        restTemplate.exchange("/api/customers/" + customerId, HttpMethod.GET, 
            new HttpEntity<>(authHeaders()), CustomerDTO.class);
        
        // Measure
        StopWatch timer = new StopWatch();
        timer.start();
        
        ResponseEntity<CustomerDTO> res = restTemplate.exchange(
            "/api/customers/" + customerId,
            HttpMethod.GET,
            new HttpEntity<>(authHeaders()),
            CustomerDTO.class
        );
        
        timer.stop();
        
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(timer.getTotalTimeMillis()).isLessThan(50);
    }
    
    @Test
    void createInvoiceShouldBeUnder150ms() {
        UUID customerId = createTestCustomer();
        CreateInvoiceRequest request = new CreateInvoiceRequest(
            customerId,
            List.of(new LineItemData("Test", BigDecimal.ONE, BigDecimal.valueOf(100))),
            null, null, null
        );
        
        StopWatch timer = new StopWatch();
        timer.start();
        
        restTemplate.postForEntity("/api/invoices", new HttpEntity<>(request, authHeaders()), InvoiceDTO.class);
        
        timer.stop();
        
        assertThat(timer.getTotalTimeMillis()).isLessThan(150);
    }
}
```

### Acceptance Criteria
- [ ] No N+1 queries detected (verify with SQL logging)
- [ ] GET /api/customers/:id < 50ms (p95)
- [ ] POST /api/invoices < 150ms (p95)
- [ ] POST /api/payments < 100ms (p95)
- [ ] Connection pool configured and active
- [ ] Performance tests pass

### Files Changed
- `application.yml`, `application-dev.yml` (HikariCP config)
- `invoices/infrastructure/InvoiceJpaRepository.java` (verify @EntityGraph)
- `src/test/java/com/invoiceme/PerformanceTest.java`

---

# Integration Phase

## Phase Overview
**Goal:** Wire frontend to real backend APIs, replace mock data  
**Timeline:** Day 6 (Integration PRs 19-20)  
**Dependencies:** Frontend complete (FR-008), Backend complete (BR-018)

---

## INT-019: Connect Frontend to Backend
**Branch:** `feat/integration-real-api`  
**Size:** ~300 LOC  
**Priority:** P0  
**Dependencies:** FR-008, BR-018

### Tasks
- [ ] Update `.env.local` to point to backend: `API_BASE_URL=http://localhost:8080`
- [ ] Flip `NEXT_PUBLIC_USE_MOCK_API=false` and `API_BASE_URL`/`API_KEY` for real mode (document mock vs API switch in README)
- [ ] Configure `ServiceProvider` to resolve real adapters that use generated API client
- [ ] Regenerate frontend types from latest OpenAPI and ensure zero manual DTO drift
- [ ] Test all CRUD operations with real backend
- [ ] Add error handling for backend-specific errors
- [ ] Update documentation (README) with backend setup

### Hook Updates
```typescript
// lib/hooks/useCustomers.ts (update to use real API)
import { apiClient } from '@/lib/services/api';

export function useCustomers(params?: { includeInactive?: boolean }) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      const response = await apiClient.get('/api/customers', { params });
      return response.data;
    },
  });
}

// Similar updates for useInvoices, usePayments, etc.
```

### Acceptance Criteria
- [ ] Frontend connects to backend on localhost:8080 via server-side proxy (no exposed secrets)
- [ ] All customer operations work (CRUD + deactivate)
- [ ] All invoice operations work (CRUD + send + payments)
- [ ] Payment recording functional
- [ ] Real-time balance updates visible
- [ ] Error messages from backend displayed correctly
- [ ] Success toasts work
- [ ] No mock API calls remaining
- [ ] README clearly explains switching between mock mode and real API mode

### Files Changed
- `.env.local` (update API URL)
- `lib/hooks/useCustomers.ts`, `useInvoices.ts`, `usePayments.ts`
- `lib/services/mockApi.ts` (remove or keep for reference)
- `README.md` (update setup instructions)

---

## INT-020: End-to-End Testing & Demo Prep
**Branch:** `feat/e2e-tests`  
**Size:** ~400 LOC  
**Priority:** P1  
**Dependencies:** INT-019

### Tasks
- [ ] Write 2-3 Playwright E2E tests (optional)
  - Happy path: Create customer → invoice → payment
  - Edge case: Overpayment rejection
- [ ] Manual QA checklist (all user stories)
- [ ] Seed demo data in database
- [ ] Test full flow in Chrome, Safari, Firefox
- [ ] Verify mobile responsiveness
- [ ] Prepare demo script for video

### E2E Test Example
```typescript
// e2e/invoice-payment-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete invoice payment flow', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // 1. Create customer
  await page.click('text=Customers');
  await page.click('text=Create Customer');
  await page.fill('input[name="name"]', 'Test Corp');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Customer created')).toBeVisible();
  
  // 2. Create invoice
  await page.click('text=Invoices');
  await page.click('text=Create Invoice');
  await page.selectOption('select[name="customerId"]', { label: 'Test Corp' });
  await page.fill('input[name="lineItems.0.description"]', 'Service');
  await page.fill('input[name="lineItems.0.quantity"]', '1');
  await page.fill('input[name="lineItems.0.unitPrice"]', '1000');
  await page.click('button[type="submit"]');
  
  // 3. Mark as sent
  await page.click('text=Mark as Sent');
  await page.click('text=Confirm');
  await expect(page.locator('text=SENT')).toBeVisible();
  
  // 4. Record payment
  await page.click('text=Record Payment');
  await page.fill('input[name="amount"]', '1000');
  await page.selectOption('select[name="paymentMethod"]', 'Wire');
  await page.click('button[type="submit"]');
  
  // 5. Verify invoice paid
  await expect(page.locator('text=PAID')).toBeVisible();
  await expect(page.locator('text=Balance: $0.00')).toBeVisible();
});
```

### Demo Script
```markdown
1. Show customer list (with active/inactive toggle)
2. Create new customer "Demo Corp"
3. Navigate to invoices, create invoice for Demo Corp
4. Add 2 line items, apply $100 discount
5. Show calculated total
6. Mark invoice as sent
7. Show invoice detail (status badge, line items, balance)
8. Record partial payment ($500 of $1400)
9. Show updated balance ($900)
10. Record final payment ($900)
11. Show invoice status changed to PAID
12. Navigate to payments list for invoice
```

### Acceptance Criteria
- [ ] All P0 user stories (US-CUST-001 through US-PAY-004) verified
- [ ] Edge cases tested (overpayment, edit SENT invoice)
- [ ] Demo data seeded (5 customers, 10 invoices, 8 payments)
- [ ] Demo script practiced (< 7 minutes)
- [ ] Mobile responsive (iPhone, iPad tested)
- [ ] No console errors in browser
- [ ] All acceptance criteria from PRD met

### Files Changed
- `e2e/invoice-payment-flow.spec.ts`, `overpayment.spec.ts`
- `backend/src/main/resources/data.sql` (demo seed data)
- `docs/DEMO_SCRIPT.md`

---

# PR Review Guidelines

## Size Guidelines
- **Small PR:** < 300 LOC (1-2 files) — 30 min review
- **Medium PR:** 300-600 LOC (3-5 files) — 1 hour review
- **Large PR:** 600-1000 LOC (6-10 files) — 2 hour review
- **XL PR:** > 1000 LOC — Split into smaller PRs

## Review Checklist
### Code Quality
- [ ] Follows coding standards (Google Java Style, ESLint/Prettier)
- [ ] No hardcoded values (use constants/config)
- [ ] Proper error handling (try-catch, validation)
- [ ] No commented-out code
- [ ] Meaningful variable/method names

### Architecture
- [ ] DDD principles followed (rich domain objects)
- [ ] CQRS separation (commands vs queries)
- [ ] Vertical slice organization maintained
- [ ] DTOs used at boundaries (no domain entities in API)
- [ ] Proper layer separation
- [ ] Command/query handlers encapsulate business rules (no pass-through wrappers)

### Testing
- [ ] Unit tests for domain logic
- [ ] Integration tests for critical flows
- [ ] Test coverage ≥ 70%
- [ ] Edge cases tested (validation, errors)
- [ ] Tests pass in CI

### Documentation
- [ ] README updated if setup changes
- [ ] API documentation (Swagger) accurate
- [ ] Complex logic has comments
- [ ] PR description explains "why" not just "what"

### Performance
- [ ] No N+1 queries (verified with logs)
- [ ] Indexes on foreign keys
- [ ] Pagination for large lists
- [ ] @Transactional on mutations

## Approval Criteria
- ✅ All CI checks pass
- ✅ No merge conflicts
- ✅ At least 1 approval (for assessment: self-approve)
- ✅ All review comments resolved

---

# CI/CD & Quality Gates

## OPS-021: GitHub Actions Pipeline
**Branch:** `chore/ci-pipeline`  
**Size:** ~200 LOC  
**Priority:** P0  
**Dependencies:** FR-001, BR-009

### Tasks
- [ ] Configure workflow to run on `pull_request` + `push` to main
- [ ] Frontend job: `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`
- [ ] Backend job: `mvn -B verify` (includes Testcontainers tests)
- [ ] Enforce `npm run generate:types` + `git diff --exit-code` to ensure OpenAPI types regen
- [ ] Add PR size checker (warn on >500 LOC diff)
- [ ] Gate merges on required status checks + conventional commit message lint
- [ ] Cache dependencies responsibly (actions/setup-node, setup-java)
- [ ] Publish coverage summary as PR comment (frontend + backend)

### Acceptance Criteria
- [ ] CI fails on lint/test/generate:types regressions
- [ ] PR builds show coverage summary and size warning when applicable
- [ ] Required checks configured in repo settings (documented in README)
- [ ] Conventional commit lint prevents non-compliant messages

---

# Appendix: PR Dependency Graph

```
Frontend Phase:
FR-001 (Setup)
  ├─→ FR-002 (Types)
  │     └─→ FR-003 (Mock API)
  │           └─→ FR-005 (Customers)
  │           └─→ FR-006 (Invoices)
  │           └─→ FR-007 (Payments)
  └─→ FR-004 (Shared Components)
        └─→ FR-005, FR-006, FR-007

FR-008 (Polish) depends on FR-005, FR-006, FR-007

Backend Phase:
BR-009 (Setup)
  └─→ BR-010 (Migrations)
        └─→ BR-011 (Shared Infra)
              ├─→ BR-012 (Customers)
              ├─→ BR-013 (Invoices CRUD)
              │     └─→ BR-014 (Invoices Lifecycle)
              │           └─→ BR-015 (Payments)
              └─→ BR-015 (Payments)
              └─→ BR-017 (OpenAPI)

BR-016 (Tests) depends on BR-015
BR-018 (Performance) depends on BR-016

Integration Phase:
INT-019 (Connect) depends on FR-008, BR-018
INT-020 (E2E) depends on INT-019

Operations:
OPS-021 (CI Pipeline) depends on FR-001, BR-009
```

---

**END OF PR TASK LISTS**

