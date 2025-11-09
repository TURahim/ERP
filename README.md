# InvoiceMe ERP - Full Stack Application

## Project Overview

InvoiceMe ERP is a modern, full-featured invoice management system built with Next.js 16 (frontend) and Spring Boot (backend). This is a premium financial application designed for businesses to manage customers, invoices, and payments with ease.

**Status**: ✅ Production Ready - Deployed to AWS & Vercel
**Frontend**: Next.js 16 (App Router), React 19, TypeScript, TailwindCSS v4, React Query, React Hook Form, Zod
**Backend**: Spring Boot 3.2, Java 17, PostgreSQL, Docker
**Infrastructure**: AWS RDS, Elastic Beanstalk, Vercel, CloudWatch

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

The frontend now supports both mock API and real backend API. Switching between them is controlled by environment variables.

**To use Mock API (default):**
1. Set `NEXT_PUBLIC_USE_MOCK_API=true` in `.env.local`
2. No backend required - works out of the box

**To use Real Backend API:**
1. Ensure backend is running on `http://localhost:8080` (or configure `NEXT_PUBLIC_API_BASE_URL`)
2. Set `NEXT_PUBLIC_USE_MOCK_API=false` in `.env.local`
3. Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080` (if different from default)
4. Set `NEXT_PUBLIC_API_KEY=demo-api-key-12345` (or your API key)
5. Restart the Next.js dev server

The `ServiceProviderWrapper` automatically selects the correct service implementation based on `NEXT_PUBLIC_USE_MOCK_API`. No code changes needed!

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
# API Mode: Set to "true" to use mock API, "false" to use real backend
NEXT_PUBLIC_USE_MOCK_API=true

# Backend API Configuration (only used when NEXT_PUBLIC_USE_MOCK_API=false)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_API_KEY=demo-api-key-12345

# Analytics (optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=...
\`\`\`

### Available Variables

| Variable | Type | Purpose | Default |
|----------|------|---------|---------|
| `NEXT_PUBLIC_USE_MOCK_API` | boolean | Use mock API instead of real backend | `true` |
| `NEXT_PUBLIC_API_BASE_URL` | string | Backend API endpoint | `http://localhost:8080` |
| `NEXT_PUBLIC_API_KEY` | string | API key for backend authentication | `demo-api-key-12345` |
| `NODE_ENV` | string | Environment (development/production) | - |

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never expose secrets!

### Backend Setup

To connect to the real backend:

1. **Start the backend server**:
   
   **Option A: Using Maven (if installed):**
   \`\`\`bash
   cd ../backend
   mvn spring-boot:run
   \`\`\`
   
   **Option B: Install Maven first (if not installed):**
   - macOS: `brew install maven`
   - Or download from: https://maven.apache.org/download.cgi
   
   The backend runs on `http://localhost:8080` by default.
   
   **Note:** The backend directory is at the same level as the ERP frontend directory (`ERP_project/backend`).

2. **Update `.env.local`**:
   \`\`\`env
   NEXT_PUBLIC_USE_MOCK_API=false
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
   NEXT_PUBLIC_API_KEY=demo-api-key-12345
   \`\`\`

3. **Seed demo data** (optional but recommended):
   \`\`\`bash
   npm run seed:demo
   \`\`\`
   This creates 8 customers, ~20 invoices, and multiple payments for demo purposes.
   
   **Note:** Make sure the backend is running before seeding. The script will connect to `http://localhost:8080` by default.

4. **Restart the Next.js dev server**:
   \`\`\`bash
   npm run dev
   \`\`\`

The frontend will automatically use the real backend API. All existing components and hooks work without changes!

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

### Production URLs

| Component | URL | Status |
|-----------|-----|--------|
| **Frontend** | https://v0-ezd0tz8pp-trahim-8750s-projects.vercel.app | ✅ Live |
| **Backend API** | http://invoiceme-prod.eba-up82v3qa.us-east-2.elasticbeanstalk.com | ✅ Live |
| **Database** | RDS PostgreSQL (us-east-2) | ✅ Active |

### Architecture

```
┌─────────────────┐
│   Vercel CDN    │  (Frontend - HTTPS)
│   (Worldwide)   │
└────────┬────────┘
         │
         ├─→ [CORS] 
         │
┌────────▼──────────────────────┐
│   AWS Elastic Beanstalk       │  (Backend API - HTTP)
│   - Auto-scaling (t3.micro)   │
│   - Load Balancer             │
│   - CloudWatch Monitoring     │
└────────┬──────────────────────┘
         │
┌────────▼──────────────────────┐
│   AWS RDS PostgreSQL          │
│   - Multi-AZ capable          │
│   - Automated backups (7 days)│
│   - Encryption enabled        │
└───────────────────────────────┘
```

### Full Deployment Documentation

For comprehensive deployment information, see:
- **Backend Deployment**: `backend-spring/docs/AWS_DEPLOYMENT.md`
- **Frontend Deployment**: `docs/FRONTEND_DEPLOYMENT.md`
- **Deployment Validation**: `docs/DEPLOYMENT_VALIDATION.md`
- **Database Setup**: `backend-spring/docs/POSTGRES_SETUP.md`

### Environment Variables (Production)

**Frontend (Vercel):**
```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=https://invoiceme-prod.eba-up82v3qa.us-east-2.elasticbeanstalk.com
NEXT_PUBLIC_API_KEY=prod-api-key-1762729910
```

**Backend (Elastic Beanstalk):**
```env
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://invoiceme-db.c1uuigcm4bd1.us-east-2.rds.amazonaws.com:5432/postgres
SPRING_DATASOURCE_USERNAME=invoiceme_admin
SPRING_DATASOURCE_PASSWORD=09nZ6sg399CVAvwP
API_KEY=prod-api-key-1762729910
SERVER_PORT=5000
```

### Deploying to Production

**Frontend (Vercel):**
```bash
# Already deployed - auto-deploys on git push to main
vercel --prod
```

**Backend (AWS Elastic Beanstalk):**
```bash
cd backend-spring
./mvnw clean package -DskipTests
aws s3 cp target/erp-backend-0.0.1-SNAPSHOT.jar s3://invoiceme-eb-deployments-us-east-2/
aws elasticbeanstalk create-application-version --application-name invoiceme --version-label vX.X.X --source-bundle ...
```

### Pre-deployment Checklist

- [x] All protected routes properly wrapped
- [x] Environment variables configured
- [x] Build succeeds: `npm run build`
- [x] Backend tests pass
- [x] Login/signup flow tested
- [x] Protected routes redirect properly
- [x] CSV export functionality working
- [x] Demo account auto-login working
- [x] Database migrations verified
- [x] CloudWatch monitoring enabled

---

## Features

### ✅ Complete Feature Set

**Authentication & Authorization**
- User registration and login
- Email-based authentication
- Session management with localStorage
- Protected routes with automatic redirects
- Demo account with auto-login

**Customer Management**
- Create, read, update, delete (CRUD) customers
- Customer search and filtering
- Export customers to CSV
- Bulk operations ready

**Invoice Management**
- Create and manage invoices
- Draft, send, and paid status tracking
- Line items with quantity and unit price
- Automatic balance calculation
- Invoice detail view with full history
- Export invoices to CSV

**Payment Processing**
- Record payments against invoices
- Multiple payment method support
- Automatic balance updates
- Payment history tracking

**Dashboard & Reporting**
- Real-time metrics (customers, invoices, outstanding balance)
- Financial overview
- CSV exports for data analysis

### Backend Integration Status

✅ **Full Stack Integration Complete!**

The frontend is now fully integrated with the Spring Boot backend. Both mock and real API modes are supported.

### What's Integrated

- ✅ Customer CRUD operations (local & production)
- ✅ Invoice CRUD operations (local & production)
- ✅ Invoice lifecycle (send invoice, status updates)
- ✅ Payment recording with balance tracking
- ✅ Real-time balance updates
- ✅ Error handling for backend errors
- ✅ Automatic service switching (mock ↔ real)
- ✅ API key authentication
- ✅ CORS support
- ✅ CSV export for customers & invoices
- ✅ Demo account with mock data

### Testing the Application

**Local Testing:**
```bash
# 1. Start PostgreSQL
cd backend-spring
docker compose up -d

# 2. Start backend
./scripts/run-prod.sh

# 3. In new terminal, start frontend
cd ../ERP
npm run dev

# 4. Seed demo data
npm run seed:demo

# 5. Open browser
open http://localhost:3001
```

**Production Testing:**
```bash
# Visit frontend
open https://v0-ezd0tz8pp-trahim-8750s-projects.vercel.app

# Test API directly
curl -H "X-API-Key: prod-api-key-1762729910" \
  http://invoiceme-prod.eba-up82v3qa.us-east-2.elasticbeanstalk.com/api/customers
```

### Next Steps

- [ ] Enable HTTPS on backend (ACM certificate)
- [ ] Add end-to-end tests
- [ ] Set up automated CI/CD pipeline
- [ ] Implement database migrations (Flyway)
- [ ] Add APM monitoring (New Relic/Datadog)
- [ ] Configure custom domain
- [ ] Set up alert notifications

---

## Repository Structure

```
invoiceme-erp/
├── app/                          # Frontend (Next.js)
│   ├── (auth)/                   # Authentication pages
│   ├── api/                      # API proxy routes
│   ├── dashboard/                # Dashboard page
│   ├── customers/                # Customer pages
│   ├── invoices/                 # Invoice pages
│   └── layout.tsx                # Root layout
│
├── components/                   # React components
│   ├── layout/                   # Layout components
│   ├── auth/                     # Authentication components
│   ├── forms/                    # Form components
│   └── ui/                       # shadcn/ui components
│
├── lib/                          # Application logic
│   ├── contexts/                 # React contexts
│   ├── hooks/                    # Custom hooks
│   ├── services/                 # API services
│   ├── types/                    # TypeScript types
│   └── utils/                    # Utility functions
│
├── scripts/                      # Utility scripts
│   ├── seed-demo-data.ts         # Demo data seeding
│   ├── test-backend-connection.js
│   └── smoke-test-prod.sh        # Production smoke test
│
├── docs/                         # Documentation
│   ├── BACKEND_SETUP.md          # Backend setup guide
│   ├── DEPLOYMENT_SUMMARY.md     # Deployment overview
│   ├── DEPLOYMENT_VALIDATION.md  # Production validation
│   ├── FRONTEND_DEPLOYMENT.md    # Frontend deployment
│   └── README.md                 # This file
│
├── backend-spring/               # Backend (Spring Boot)
│   ├── src/main/java/            # Java source code
│   │   └── com/invoiceme/erp/
│   │       ├── controller/       # REST controllers
│   │       ├── service/          # Business logic
│   │       ├── repository/       # Data access
│   │       ├── model/            # JPA entities
│   │       ├── dto/              # Data transfer objects
│   │       ├── config/           # Configuration
│   │       └── exception/        # Exception handling
│   │
│   ├── src/main/resources/       # Configuration files
│   │   ├── application.properties
│   │   └── application-prod.properties
│   │
│   ├── docs/                     # Backend documentation
│   │   ├── AWS_DEPLOYMENT.md
│   │   ├── DATABASE_MIGRATIONS.md
│   │   ├── GETTING_STARTED.md
│   │   ├── OBSERVABILITY.md
│   │   ├── POSTGRES_SETUP.md
│   │   ├── SMOKE_TEST_CHECKLIST.md
│   │   └── TESTING_GUIDE.md
│   │
│   ├── scripts/                  # Backend scripts
│   │   ├── run-dev.sh            # Run with H2
│   │   ├── run-prod.sh           # Run with PostgreSQL
│   │   └── build-docker.sh       # Build Docker image
│   │
│   ├── Dockerfile                # Production image
│   ├── docker-compose.yml        # Local PostgreSQL
│   ├── docker-compose-full.yml   # Full stack locally
│   ├── pom.xml                   # Maven configuration
│   └── README.md                 # Backend README
│
├── .env.example                  # Environment template
├── .env.local                    # Local development (git ignored)
├── .gitignore                    # Git ignore rules
├── package.json                  # Frontend dependencies
├── tsconfig.json                 # TypeScript config
├── next.config.mjs               # Next.js config
└── README.md                     # This file
```

## Quick Links

### Getting Started
- [Frontend Getting Started](#getting-started)
- [Backend Setup](backend-spring/docs/GETTING_STARTED.md)
- [Local Development](#environment-variables)

### Deployment
- [Vercel Deployment](docs/FRONTEND_DEPLOYMENT.md)
- [AWS Deployment](backend-spring/docs/AWS_DEPLOYMENT.md)
- [Production URLs](#production-urls)

### Documentation
- [Frontend Architecture](#architecture--design-patterns)
- [Backend README](backend-spring/README.md)
- [Database Setup](backend-spring/docs/POSTGRES_SETUP.md)
- [Testing Guide](backend-spring/docs/TESTING_GUIDE.md)
- [Deployment Validation](docs/DEPLOYMENT_VALIDATION.md)

### APIs
- [Mock API](lib/services/mockApi.ts)
- [Real API (Backend)](backend-spring/src/main/java/com/invoiceme/erp/controller/)
- [Frontend Hooks](#key-hooks--utilities)

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **React Query**: https://tanstack.com/query/latest
- **TailwindCSS v4**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **TypeScript**: https://www.typescriptlang.org/docs
- **Spring Boot**: https://spring.io/projects/spring-boot
- **PostgreSQL**: https://www.postgresql.org/docs/
- **AWS Documentation**: https://docs.aws.amazon.com/

---

## License

[Add your license here]

---

## Contributing

Please follow these guidelines:
1. Create feature branches from `main`
2. Write descriptive commit messages
3. Test locally before pushing
4. Submit PRs with clear descriptions

---

## Support

For issues or questions:
1. Check the relevant documentation file
2. Review the GitHub Issues
3. Check the deployment validation checklist

**Last Updated**: November 9, 2025
**Version**: 1.0.0 (Production Release)
