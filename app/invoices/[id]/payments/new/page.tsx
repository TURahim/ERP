"use client"

import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PaymentForm } from "@/components/forms/payment-form"
import { useInvoice } from "@/lib/hooks/useInvoices"
import { useCustomer } from "@/lib/hooks/useCustomers"
import { useCreatePayment } from "@/lib/hooks/usePayments"
import { formatCurrency } from "@/lib/utils/formatting"
import type { CreatePaymentRequest } from "@/lib/types"

export default function RecordPaymentPage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string

  const { data: invoice, isLoading: invoiceLoading } = useInvoice(invoiceId)
  const { data: customer } = useCustomer(invoice?.customerId || "")
  const createPayment = useCreatePayment()

  if (invoiceLoading) return <div className="container py-8">Loading...</div>
  if (!invoice) return <div className="container py-8">Invoice not found</div>

  const handleSubmit = async (data: CreatePaymentRequest) => {
    createPayment.mutate(data, {
      onSuccess: () => {
        router.push(`/invoices/${invoiceId}`)
      },
    })
  }

  return (
    <ProtectedRoute>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link href={`/invoices/${invoiceId}`}>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Record Payment</h1>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Invoice Number
                  </dt>
                  <dd className="mt-2 text-base font-medium">{invoice.invoiceNumber}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</dt>
                  <dd className="mt-2 text-base">{customer?.name || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Amount</dt>
                  <dd className="mt-2 text-base">{formatCurrency(invoice.total)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Balance Due</dt>
                  <dd className="mt-2 text-lg font-bold text-primary">{formatCurrency(invoice.balance)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <PaymentForm
            invoiceId={invoiceId}
            maxAmount={invoice.balance}
            onSubmit={handleSubmit}
            isLoading={createPayment.isPending}
          />
        </div>
      </div>
    </ProtectedRoute>
  )
}

