// Core types re-exported from generated schema
// These will be updated after FR-002

export interface Customer {
  id: string
  name: string
  email?: string
  billingAddress?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCustomerRequest {
  name: string
  email?: string
  billingAddress?: string
}

export interface UpdateCustomerRequest {
  name?: string
  email?: string
  billingAddress?: string
}

export interface Invoice {
  id: string
  customerId: string
  invoiceNumber: string
  status: "DRAFT" | "SENT" | "PAID"
  total: number
  balance: number
  dueDate: string
  lineItems: InvoiceLineItem[]
  createdAt: string
  updatedAt: string
}

export interface CreateInvoiceRequest {
  customerId: string
  lineItems: InvoiceLineItem[]
  dueDate: string
}

export interface UpdateInvoiceRequest {
  lineItems?: InvoiceLineItem[]
  dueDate?: string
}

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number
  paymentMethod: "Cash" | "Card" | "Wire" | "ACH" | "Check" | "Other"
  createdAt: string
}

export interface CreatePaymentRequest {
  invoiceId: string
  amount: number
  paymentMethod: Payment["paymentMethod"]
}

export interface PaginationMeta {
  page: number
  size: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T
  pagination?: PaginationMeta
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface ErrorEnvelope {
  error: ApiError
}
