"use client"

import { type PropsWithChildren, createContext, useContext } from "react"
import type {
  Customer,
  Invoice,
  Payment,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  CreatePaymentRequest,
  ApiResponse,
} from "@/lib/types"
import { mockServices } from "@/lib/services/mockApi"

export interface CustomerService {
  list(params: { page: number; size: number; includeInactive?: boolean }): Promise<ApiResponse<Customer[]>>
  get(id: string): Promise<Customer>
  create(payload: CreateCustomerRequest): Promise<Customer>
  update(id: string, payload: UpdateCustomerRequest): Promise<Customer>
  deactivate(id: string): Promise<Customer>
}

export interface InvoiceService {
  list(params: { status?: Invoice["status"]; customerId?: string; page: number; size: number }): Promise<
    ApiResponse<Invoice[]>
  >
  get(id: string): Promise<Invoice>
  create(payload: CreateInvoiceRequest): Promise<Invoice>
  update(id: string, payload: UpdateInvoiceRequest): Promise<Invoice>
  send(id: string): Promise<Invoice>
  getPayments(id: string): Promise<Payment[]>
}

export interface PaymentService {
  create(payload: CreatePaymentRequest): Promise<Payment>
  get(id: string): Promise<Payment>
}

export type ServiceRegistry = {
  customers: CustomerService
  invoices: InvoiceService
  payments: PaymentService
}

const ServiceContext = createContext<ServiceRegistry | null>(null)

export function ServiceProvider({ children, services }: PropsWithChildren<{ services: ServiceRegistry }>) {
  return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>
}

export function useService<Name extends keyof ServiceRegistry>(name: Name): ServiceRegistry[Name] {
  const services = useContext(ServiceContext)
  if (!services) throw new Error("ServiceProvider missing")
  return services[name]
}

// Client-side wrapper that initializes services
// This component must be used in client components to avoid passing functions from server to client
// By importing mockServices directly in this client component, we avoid serialization issues
export function ServiceProviderWrapper({ children }: PropsWithChildren) {
  // Import services directly in client component - this is safe because:
  // 1. This is a client component ("use client")
  // 2. mockServices is just an object with functions, which is fine in client components
  // 3. We're not passing it from a server component anymore
  return <ServiceContext.Provider value={mockServices}>{children}</ServiceContext.Provider>
}
