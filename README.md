# InvoiceMe ERP - Frontend Documentation

## Project Overview

InvoiceMe ERP is a modern, full-featured invoice management system built with Next.js 14 and TypeScript. This is a premium financial application designed for businesses to manage customers, invoices, and payments with ease. The frontend is built with a complete mock API layer ready for backend integration.

**Status**: Frontend Phase (v0) Complete - Ready for backend integration
**Tech Stack**: Next.js 14 (App Router), React 19, TypeScript, TailwindCSS v4, React Query, React Hook Form, Zod

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Architecture & Design Patterns](#architecture--design-patterns)
4. [Authentication System](#authentication-system)
5. [Mock API & Data Flow](#mock-api--data-flow)
6. [Component Library](#component-library)
7. [Styling & Design System](#styling--design-system)
8. [Adding New Features](#adding-new-features)
9. [Key Hooks & Utilities](#key-hooks--utilities)
10. [Environment Variables](#environment-variables)
11. [Common Tasks & Workflows](#common-tasks--workflows)

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
\`\`\`

Visit `http://localhost:3000` to view the application.

### Demo Credentials

The authentication system is mock-based. Any email/password combination works:
- Email: `test@example.com`
- Password: `password123`

---

## Project Structure

\`\`\`
invoiceme-erp/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Global styles & design tokens
│   ├── dashboard/
│   │   └── page.tsx            # Main dashboard (protected)
│   ├── customers/
│   │   ├── page.tsx            # Customer list (protected)
│   │   ├── new/
│   │   │   └── page.tsx        # Create customer form (protected)
│   │   └── [id]/
│   │       ├── page.tsx        # Customer detail (protected)
│   │       └── edit/
│   │           └── page.tsx    # Edit customer form (protected)
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── signup/
│   │   └── page.tsx            # Sign-up page
│   └── api/
│       └── backend/
│           └── [...path]/
│               └── route.ts    # Backend proxy for API key injection
│
├── components/
│   ├── layout/
│   │   └── Navbar.tsx          # Top navigation bar
│   ├── auth/
│   │   └── protected-route.tsx # Route protection wrapper
│   ├── forms/
│   │   └── customer-form.tsx   # Reusable customer form
│   └── ui/                     # shadcn/ui components (pre-installed)
│
├── lib/
│   ├── contexts/
│   │   └── auth-context.tsx    # Auth state management
│   ├── hooks/
│   │   ├── useAuth.ts          # Auth hook
│   │   ├── useRequireAuth.ts   # Protected route hook
│   │   └── useCustomers.ts     # Customer data hooks
│   ├── services/
│   │   ├── contracts.tsx       # Service interface definitions
│   │   ├── api.ts              # Axios API client
│   │   ├── mockApi.ts          # Mock API implementation
│   │   ├── query-client.ts     # React Query setup
│   │   └── ServiceProvider.tsx # Service dependency injection
│   ├── types/
│   │   └── index.ts            # TypeScript domain models
│   └── utils.ts                # Utility functions
│
├── public/
│   └── [assets]                # Static files
│
├── .env.example                # Environment variable template
├── next.config.mjs             # Next.js configuration
├── tsconfig.json               # TypeScript configuration
└── package.json
\`\`\`

---

## Architecture & Design Patterns

### Service-Oriented Architecture

The application uses a **Service Registry Pattern** to abstract API implementation details:

\`\`\`
Components → Hooks (useCustomers) → ServiceContext → ServiceRegistry → Mock/Real API
\`\`\`

**Benefits**:
- Easy switching between mock and real API (one import change)
- Type-safe service contracts
- Centralized error handling
- Consistent data flow across the app

### Data Flow

1. **UI Component** renders and calls custom hook
2. **Custom Hook** (e.g., `useCustomers`) uses React Query
3. **React Query** manages caching and calls service
4. **ServiceRegistry** routes to current implementation (mock/real)
5. **Mock/Real API** returns typed data
6. **Component** re-renders with fresh data

### State Management

- **Authentication**: React Context (in-memory + localStorage)
- **Server State**: React Query (caching, synchronization)
- **Form State**: React Hook Form (optimized for performance)
- **UI State**: React component state (local)

---

## Authentication System

### How It Works

1. **Sign Up / Login**: Creates an authenticated user session stored in localStorage
2. **Protected Routes**: Wrapped with `ProtectedRoute` component that checks auth state
3. **Auto-redirect**: Unauthenticated users redirected to `/login`
4. **Navbar Integration**: Shows login/signup buttons or user email + logout

### Files

- `lib/contexts/auth-context.tsx` - AuthProvider and useAuth hook
- `lib/hooks/useRequireAuth.ts` - Hook for protecting components
- `components/auth/protected-route.tsx` - Route wrapper component
- `app/login/page.tsx` - Login page
- `app/signup/page.tsx` - Sign-up page

### Usage

**Protect a page:**
\`\`\`tsx
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      {/* Your protected content */}
    </ProtectedRoute>
  )
}
\`\`\`

**Use auth in a component:**
\`\`\`tsx
import { useAuth } from "@/lib/contexts/auth-context"

export default function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth()
  return <div>{user?.email}</div>
}
\`\`\`

### Transitioning to Real Auth

To integrate with a real backend (e.g., Supabase, NextAuth):

1. Replace `AuthProvider` logic in `lib/contexts/auth-context.tsx`
2. Update login/signup pages to call real API
3. Protected routes remain unchanged
4. No component-level changes needed

---

## Mock API & Data Flow

### Current Implementation

The mock API simulates a complete backend with:

- **10 mock customers** with realistic data
- **20 mock invoices** (DRAFT, SENT, PAID statuses)
- **15 mock payments** linked to invoices
- **200ms network latency** to simulate real conditions
- **Validation logic** (duplicate email checks, overpayment guards)

### Files

- `lib/services/mockApi.ts` - Mock API implementation with all endpoints
- `lib/services/api.ts` - Axios client configuration
- `lib/services/contracts.tsx` - Service interface (what real API must implement)
- `lib/types/index.ts` - Domain models (TypeScript interfaces)

### Available Endpoints

**Customers:**
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer detail
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Deactivate customer

**Invoices:**
- `GET /api/invoices` - List invoices
- `GET /api/invoices/:id` - Get invoice detail
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice

**Payments:**
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment

### Data Models

\`\`\`typescript
interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  isActive: boolean
  createdAt: string
}

interface Invoice {
  id: string
  customerId: string
  invoiceNumber: string
  totalAmount: number
  paidAmount: number
  balance: number
  status: "DRAFT" | "SENT" | "PAID"
  dueDate: string
  issuedDate: string
  lineItems: LineItem[]
  createdAt: string
}

interface Payment {
  id: string
  invoiceId: string
  amount: number
  paymentDate: string
  paymentMethod: string
  createdAt: string
}
\`\`\`

### Switching to Real Backend

1. **Create real API service** implementing `IServiceRegistry` interface
2. **Update ServiceProvider import** in `app/layout.tsx`:
   \`\`\`tsx
   import { realServices } from "@/lib/services/realApi"
   // Change from: mockServices to: realServices
   \`\`\`
3. **Update environment variables** with real API URLs
4. **All components automatically use real API** - no changes needed!

---

## Component Library

### Core Components

**Layout Components:**
- `Navbar` - Top navigation with auth controls
- Protected pages use centered, card-based layouts

**Form Components:**
- `CustomerForm` - Reusable customer CRUD form with validation
- Built with React Hook Form + Zod for type safety

**UI Components (from shadcn/ui):**
- Button, Card, Input, Label, Select, Textarea
- Dialog, DropdownMenu, AlertDialog
- Table, Skeleton, Badge
- Toast notifications via `useToast`

**Custom Components:**
- `StatusBadge` - Color-coded invoice status display
- `EmptyState` - Placeholder for empty lists
- `TableSkeleton` - Loading skeleton for tables
- `CardSkeleton` - Loading skeleton for cards

### Creating New Components

1. **Create file** in `components/` with `.tsx` extension
2. **Use shadcn components** as building blocks
3. **Apply design tokens** from `globals.css`
4. **Export default** for tree-shaking

---

## Styling & Design System

### Design Tokens

Located in `app/globals.css`, defines:

**Colors** (Premium finance palette):
- `--primary`: Deep blue (#4018F6)
- `--accent`: Emerald green (#93C26E)
- `--background`, `--card`, `--border`: Neutrals
- `--destructive`: Red for alerts

**Typography**:
- `--font-sans`: Geist (body text)
- `--font-mono`: Geist Mono (code)

**Spacing & Radius**:
- Tailwind spacing scale (p-2, m-4, gap-6)
- `--radius`: 0.5rem (rounded corners)

### TailwindCSS v4

- Uses `@import "tailwindcss"` instead of `@tailwind` directives
- CSS Variables for color theming
- Dark mode support via `.dark` class
- No tailwind.config.js needed (configured in globals.css)

### Applying Styles

\`\`\`tsx
// Use semantic classes
<div className="bg-card text-foreground border border-border rounded-lg p-4">

// Use design tokens
<h1 className="text-primary font-bold">Title</h1>

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Dark mode
<div className="bg-background dark:bg-slate-950">
\`\`\`

---

## Adding New Features

### Adding a New Customer Page

1. **Create route**: `app/customers/invoices/page.tsx`
2. **Protect the page**:
   \`\`\`tsx
   import { ProtectedRoute } from "@/components/auth/protected-route"
   
   export default function CustomerInvoicesPage() {
     return (
       <ProtectedRoute>
         {/* Your content */}
       </ProtectedRoute>
     )
   }
   \`\`\`
3. **Use data hooks**:
   \`\`\`tsx
   import { useCustomers } from "@/lib/hooks/useCustomers"
   
   const { data: customers, isLoading } = useCustomers()
   \`\`\`
4. **Style with design tokens** from globals.css

### Adding a New Data Model

1. **Update types** in `lib/types/index.ts`
2. **Add service methods** in `lib/services/contracts.tsx`
3. **Implement in mock** in `lib/services/mockApi.ts`
4. **Create hook** in `lib/hooks/` (e.g., `useInvoices.ts`)
5. **Use in components**

### Adding a New Form

1. **Create form component** in `components/forms/`
2. **Use React Hook Form + Zod**:
   \`\`\`tsx
   import { useForm } from "react-hook-form"
   import { zodResolver } from "@hookform/resolvers/zod"
   
   const schema = z.object({
     email: z.string().email(),
     // ...
   })
   
   export function MyForm() {
     const { register, handleSubmit } = useForm({
       resolver: zodResolver(schema),
     })
   }
   \`\`\`
3. **Call service on submit**
4. **Invalidate React Query cache**:
   \`\`\`tsx
   const { mutate: createCustomer } = useCreateCustomer()
   \`\`\`

---

## Key Hooks & Utilities

### Authentication Hooks

**`useAuth()`**
Returns `{ user, isAuthenticated, login, signup, logout }`

**`useRequireAuth()`**
Automatically redirects to `/login` if not authenticated

### Customer Hooks

All located in `lib/hooks/useCustomers.ts`:

**`useCustomers()`**
- Query hook for fetching all customers
- Returns `{ data, isLoading, error }`

**`useCustomer(id)`**
- Query hook for single customer
- Automatically manages cache

**`useCreateCustomer()`**
- Mutation hook for creating customer
- Auto-invalidates customer list cache

**`useUpdateCustomer()`**
- Mutation hook for updating customer
- Auto-invalidates related caches

**`useDeactivateCustomer()`**
- Mutation hook for soft-deleting customer

### Query Client

`lib/services/query-client.ts`:
- Configured with 5-minute cache duration
- Automatic garbage collection
- DevTools enabled in development

### Utilities

**`lib/utils.ts`**:
- `cn()` - ClassNames merger (Tailwind safe)

---

## Environment Variables

### Required for Development

Create `.env.local` (copy from `.env.example`):

\`\`\`env
# Backend API (for future integration)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Authentication (if using real auth provider)
# NEXT_PUBLIC_AUTH_URL=...

# Analytics (optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=...
\`\`\`

### Available Variables

| Variable | Type | Purpose |
|----------|------|---------|
| `NEXT_PUBLIC_API_URL` | string | Backend API endpoint |
| `NEXT_PUBLIC_DEV_MODE` | boolean | Demo mode indicator |
| `NODE_ENV` | string | Environment (development/production) |

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never expose secrets!

---

## Common Tasks & Workflows

### Display a Loading State

\`\`\`tsx
import { TableSkeleton } from "@/components/ui/table-skeleton"

export function CustomerList() {
  const { isLoading } = useCustomers()
  
  if (isLoading) return <TableSkeleton />
  
  return <table>{/* ... */}</table>
}
\`\`\`

### Show a Toast Notification

\`\`\`tsx
import { useToast } from "@/hooks/use-toast"

export function MyComponent() {
  const { toast } = useToast()
  
  const handleClick = () => {
    toast({
      title: "Success",
      description: "Customer created",
      variant: "default",
    })
  }
}
\`\`\`

### Invalidate Cache After Mutation

\`\`\`tsx
import { queryClient } from "@/lib/services/query-client"

await createCustomer(data)
queryClient.invalidateQueries({ queryKey: ["customers"] })
\`\`\`

### Redirect After Action

\`\`\`tsx
import { useRouter } from 'next/navigation'

export function MyForm() {
  const router = useRouter()
  
  const onSuccess = () => {
    router.push("/customers")
  }
}
\`\`\`

### Format Currency

\`\`\`tsx
const formatted = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format(amount)
\`\`\`

### Format Date

\`\`\`tsx
const formatted = new Date(dateString).toLocaleDateString("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
})
\`\`\`

---

## Debugging Tips

### Enable React Query DevTools

Already enabled in development. Press "DevTools" button or check browser console.

### Check Authentication State

In browser console:
\`\`\`javascript
localStorage.getItem('auth-user')
\`\`\`

### View API Requests

Open browser DevTools → Network tab → Filter XHR requests

### Debug Component Props

Add to any component:
\`\`\`tsx
console.log("[v0] Component props:", { prop1, prop2 })
\`\`\`

Remove after debugging with `// ` comment.

---

## Deployment

### To Vercel

\`\`\`bash
npm run build
vercel deploy
\`\`\`

### Environment Variables on Vercel

1. Go to Vercel dashboard → Project → Settings → Environment Variables
2. Add required `.env` variables
3. Redeploy

### Pre-deployment Checklist

- [ ] All protected routes properly wrapped
- [ ] Environment variables configured
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] Test login/signup flow
- [ ] Test protected routes redirect properly

---

## Next Steps for Backend Integration

1. **Implement real API** matching `IServiceRegistry` interface
2. **Create real authentication** (Supabase, NextAuth, etc.)
3. **Update environment variables** with real endpoints
4. **Create database migrations** for Customers, Invoices, Payments
5. **Test all data flows** with real backend
6. **Enable production build**: `npm run build && npm start`

---

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **React Query**: https://tanstack.com/query/latest
- **TailwindCSS v4**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **TypeScript**: https://www.typescriptlang.org/docs

---

## License

[Add your license here]
