"use client"

import Link from "next/link"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { useInvoice, useSendInvoice, useInvoicePayments } from "@/lib/hooks/useInvoices"
import { useCustomer } from "@/lib/hooks/useCustomers"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit2, Send, DollarSign } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { formatCurrency, formatDateLong, formatDate } from "@/lib/utils/formatting"

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data: invoice, isLoading } = useInvoice(id)
  const { data: customer } = useCustomer(invoice?.customerId || "")
  const { data: payments } = useInvoicePayments(id)
  const sendInvoice = useSendInvoice()

  if (isLoading) return <div className="container py-8">Loading...</div>
  if (!invoice) return <div className="container py-8">Invoice not found</div>

  const handleSend = () => {
    sendInvoice.mutate(id)
  }

  return (
    <ProtectedRoute>
      <div className="container py-12">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="icon">
                <Link href="/invoices">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
                <div className="mt-2">
                  <StatusBadge status={invoice.status} />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {invoice.status === "DRAFT" && (
                <>
                  <Button asChild variant="outline" className="gap-2">
                    <Link href={`/invoices/${id}/edit`}>
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Link>
                  </Button>
                  <ConfirmDialog
                    title="Mark Invoice as Sent?"
                    description="This will change the invoice status to SENT and set the issued date. You will not be able to edit the invoice after this action."
                    trigger={
                      <Button className="gap-2">
                        <Send className="w-4 h-4" />
                        Mark as Sent
                      </Button>
                    }
                    onConfirm={handleSend}
                  />
                </>
              )}
              {(invoice.status === "SENT" || invoice.status === "PAID") && invoice.balance > 0 && (
                <Button asChild className="gap-2">
                  <Link href={`/invoices/${id}/payments/new`}>
                    <DollarSign className="w-4 h-4" />
                    Record Payment
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Customer
                    </label>
                    <p className="mt-2 text-base">{customer?.name || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Due Date
                    </label>
                    <p className="mt-2 text-base">{invoice.dueDate ? formatDateLong(invoice.dueDate) : "Not set"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Total Amount
                    </label>
                    <p className="mt-2 text-lg font-semibold">{formatCurrency(invoice.total)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Balance Due
                    </label>
                    <p className="mt-2 text-lg font-bold text-primary">{formatCurrency(invoice.balance)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{formatCurrency(invoice.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-semibold">{formatCurrency(invoice.total - invoice.balance)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Balance</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(invoice.balance)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.lineItems && invoice.lineItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState message="No line items" />
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.createdAt)}</TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState message="No payments recorded" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}

