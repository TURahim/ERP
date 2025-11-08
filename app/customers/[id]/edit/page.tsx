"use client"

import { useRouter, useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomerForm } from "@/components/forms/customer-form"
import { useCustomer, useUpdateCustomer } from "@/lib/hooks/useCustomers"
import type { CustomerFormData } from "@/components/forms/customer-form"

export default function EditCustomerPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: customer, isLoading } = useCustomer(id)
  const updateCustomer = useUpdateCustomer()

  const handleSubmit = async (data: CustomerFormData) => {
    updateCustomer.mutate(
      { id, payload: data },
      {
        onSuccess: () => {
          router.push(`/customers/${id}`)
        },
      },
    )
  }

  if (isLoading) return <div className="container py-8">Loading...</div>
  if (!customer) return <div className="container py-8">Customer not found</div>

  return (
    <ProtectedRoute>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Edit Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerForm initialData={customer} onSubmit={handleSubmit} isLoading={updateCustomer.isPending} />
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
