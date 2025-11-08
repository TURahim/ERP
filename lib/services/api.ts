import axios from "axios"
import type { ErrorEnvelope } from "@/lib/types"

export const apiClient = axios.create({
  baseURL: "/api/backend",
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptors for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const envelope = error.response?.data as ErrorEnvelope | undefined

    if (envelope?.error) {
      return Promise.reject(envelope.error)
    }

    if (error.response?.status === 401) {
      console.error("Invalid API Key")
    }

    return Promise.reject(error)
  },
)
