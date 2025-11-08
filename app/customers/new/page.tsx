"use client"

import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomerForm } from "@/components/forms/customer-form"
import { useCreateCustomer } from "@/lib/hooks/useCustomers"
import type { CustomerFormData } from "@/components/forms/customer-form"

export default function NewCustomerPage() {
  const router = useRouter()
  const createCustomer = useCreateCustomer()

  const handleSubmit = async (data: CustomerFormData) => {
    createCustomer.mutate(data, {
      onSuccess: () => {
        router.push("/customers")
      },
    })
  }

  return (
    <ProtectedRoute>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create New Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerForm onSubmit={handleSubmit} isLoading={createCustomer.isPending} />
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
