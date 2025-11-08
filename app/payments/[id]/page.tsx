"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { usePayment } from "@/lib/hooks/usePayments"
import { useInvoice } from "@/lib/hooks/useInvoices"
import { useCustomer } from "@/lib/hooks/useCustomers"
import { formatCurrency, formatDateTime } from "@/lib/utils/formatting"

export default function PaymentDetailPage() {
  const params = useParams()
  const id = params.id as string

  const { data: payment, isLoading } = usePayment(id)
  const { data: invoice } = useInvoice(payment?.invoiceId || "")
  const { data: customer } = useCustomer(invoice?.customerId || "")

  if (isLoading) return <div className="container py-8">Loading...</div>
  if (!payment) return <div className="container py-8">Payment not found</div>

  return (
    <ProtectedRoute>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link href={`/invoices/${payment.invoiceId}`}>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Payment Details</h1>
              <p className="text-muted-foreground mt-1">Payment ID: {payment.id}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</label>
                  <p className="mt-2 text-2xl font-bold text-primary">{formatCurrency(payment.amount)}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Payment Method
                  </label>
                  <p className="mt-2 text-base">{payment.paymentMethod}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Payment Date
                  </label>
                  <p className="mt-2 text-base">{formatDateTime(payment.createdAt)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Related Invoice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {invoice ? (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Invoice Number
                      </label>
                      <p className="mt-2 text-base font-medium">{invoice.invoiceNumber}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Customer
                      </label>
                      <p className="mt-2 text-base">{customer?.name || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Invoice Total
                      </label>
                      <p className="mt-2 text-base">{formatCurrency(invoice.total)}</p>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/invoices/${invoice.id}`}>View Invoice</Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">Loading invoice information...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

