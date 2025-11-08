"use client"

import { useRouter, useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { InvoiceForm } from "@/components/forms/invoice-form"
import { useInvoice, useUpdateInvoice } from "@/lib/hooks/useInvoices"
import type { InvoiceFormData } from "@/components/forms/invoice-form"

export default function EditInvoicePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: invoice, isLoading } = useInvoice(id)
  const updateInvoice = useUpdateInvoice()

  const handleSubmit = async (data: InvoiceFormData) => {
    // Transform form data to API format
    const payload = {
      lineItems: data.lineItems.map((item, index) => {
        // Preserve existing IDs if available, otherwise generate temporary ones
        const existingItem = invoice.lineItems[index]
        return {
          id: existingItem?.id || `temp-${index}`,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        }
      }),
      dueDate: data.dueDate || "",
    }

    updateInvoice.mutate(
      { id, payload: payload as any },
      {
        onSuccess: () => {
          router.push(`/invoices/${id}`)
        },
      },
    )
  }

  if (isLoading) return <div className="container py-8">Loading...</div>
  if (!invoice) return <div className="container py-8">Invoice not found</div>
  if (invoice.status !== "DRAFT") {
    return (
      <ProtectedRoute>
        <div className="container py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold">Cannot Edit Invoice</h1>
              <p className="text-muted-foreground">
                Only invoices in DRAFT status can be edited. This invoice is currently {invoice.status}.
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <InvoiceForm initialData={invoice} onSubmit={handleSubmit} isLoading={updateInvoice.isPending} />
        </div>
      </div>
    </ProtectedRoute>
  )
}

