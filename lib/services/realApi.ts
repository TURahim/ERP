import axios, { AxiosInstance, AxiosError } from "axios"
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
  ErrorEnvelope,
} from "@/lib/types"

// Create axios instance with base configuration
// Uses Next.js proxy route to avoid exposing API keys to the client
function createApiClient(): AxiosInstance {
  // Use the Next.js proxy route instead of calling backend directly
  // This keeps API keys server-side only
  const baseURL = "/api/backend"

  const client = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  })

  // Add response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ErrorEnvelope>) => {
      // Transform backend error envelope to a more usable format
      if (error.response?.data?.error) {
        const apiError = error.response.data.error
        const errorMessage = new Error(apiError.message || "An error occurred")
        ;(errorMessage as any).code = apiError.code
        ;(errorMessage as any).details = apiError.details
        return Promise.reject(errorMessage)
      }
      return Promise.reject(error)
    }
  )

  return client
}

const apiClient = createApiClient()

// Transform backend response to frontend format
function transformApiResponse<T>(response: any): ApiResponse<T> {
  if (response.data && response.pagination) {
    return {
      data: response.data,
      pagination: response.pagination,
    }
  }
  return {
    data: response.data || response,
  }
}

export const realServices = {
  customers: {
    async list(params: { page: number; size: number; includeInactive?: boolean }): Promise<ApiResponse<Customer[]>> {
      const response = await apiClient.get("/api/customers", { params })
      return transformApiResponse<Customer[]>(response.data)
    },

    async get(id: string): Promise<Customer> {
      const response = await apiClient.get(`/api/customers/${id}`)
      return response.data
    },

    async create(payload: CreateCustomerRequest): Promise<Customer> {
      const response = await apiClient.post("/api/customers", payload)
      return response.data
    },

    async update(id: string, payload: UpdateCustomerRequest): Promise<Customer> {
      const response = await apiClient.put(`/api/customers/${id}`, payload)
      return response.data
    },

    async deactivate(id: string): Promise<Customer> {
      const response = await apiClient.put(`/api/customers/${id}/deactivate`)
      return response.data
    },
  },

  invoices: {
    async list(params: {
      status?: Invoice["status"]
      customerId?: string
      page: number
      size: number
    }): Promise<ApiResponse<Invoice[]>> {
      const response = await apiClient.get("/api/invoices", { params })
      return transformApiResponse<Invoice[]>(response.data)
    },

    async get(id: string): Promise<Invoice> {
      const response = await apiClient.get(`/api/invoices/${id}`)
      return response.data
    },

    async create(payload: CreateInvoiceRequest): Promise<Invoice> {
      const response = await apiClient.post("/api/invoices", payload)
      return response.data
    },

    async update(id: string, payload: UpdateInvoiceRequest): Promise<Invoice> {
      const response = await apiClient.put(`/api/invoices/${id}`, payload)
      return response.data
    },

    async send(id: string): Promise<Invoice> {
      const response = await apiClient.post(`/api/invoices/${id}/send`)
      return response.data
    },

    async getPayments(id: string): Promise<Payment[]> {
      const response = await apiClient.get(`/api/invoices/${id}/payments`)
      return response.data
    },
  },

  payments: {
    async create(payload: CreatePaymentRequest): Promise<Payment> {
      const response = await apiClient.post("/api/payments", payload)
      return response.data
    },

    async get(id: string): Promise<Payment> {
      const response = await apiClient.get(`/api/payments/${id}`)
      return response.data
    },
  },
}

