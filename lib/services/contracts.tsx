"use client"

import { type PropsWithChildren, createContext, useContext, useMemo } from "react"
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
import { realServices } from "@/lib/services/realApi"
import { useAuth } from "@/lib/contexts/auth-context"

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

// Client-side wrapper that initializes services based on environment variable
// This component must be used in client components to avoid passing functions from server to client
export function ServiceProviderWrapper({ children }: PropsWithChildren) {
  // Check if we should use mock API or real API
  const { user } = useAuth()
  const envUseMock = process.env.NEXT_PUBLIC_USE_MOCK_API === "true"
  const shouldUseMock = envUseMock || user?.email === "demo@invoiceme.com"

  const services = useMemo(() => (shouldUseMock ? mockServices : realServices), [shouldUseMock])

  return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>
}
