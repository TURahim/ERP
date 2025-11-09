"use client"

import { useState } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useInvoices } from "@/lib/hooks/useInvoices"
import { useCustomers } from "@/lib/hooks/useCustomers"
import { StatusBadge } from "@/components/ui/status-badge"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Plus, Eye, Download } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils/formatting"
import { exportInvoicesToCsv } from "@/lib/utils/csv"
import { useToast } from "@/hooks/use-toast"
import type { Invoice } from "@/lib/types"

export default function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<Invoice["status"] | "ALL">("ALL")
  const [customerFilter, setCustomerFilter] = useState<string>("ALL")
  const { data: invoicesData, isLoading } = useInvoices({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    customerId: customerFilter === "ALL" ? undefined : customerFilter,
    page: 0,
    size: 1000, // Fetch more for export
  })
  const { data: customersData } = useCustomers({ includeInactive: false })
  const { toast } = useToast()

  const invoices = invoicesData?.data ?? []
  const customers = customersData?.data ?? []
  const pagination = invoicesData?.pagination

  const handleExportCsv = () => {
    if (invoices.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no invoices to export.",
        variant: "destructive",
      })
      return
    }

    try {
      // Create customer name map for better CSV readability
      const customerMap = new Map(customers.map((c) => [c.id, c.name]))
      exportInvoicesToCsv(invoices, customerMap)
      toast({
        title: "Export successful",
        description: `Exported ${invoices.length} invoice(s) to CSV`,
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export invoices. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) return <TableSkeleton />

  return (
    <ProtectedRoute>
      <div className="container py-12">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-muted-foreground mt-2">Manage and track all your invoices</p>
          </div>
          <div className="flex gap-3">
            {invoices.length > 0 && (
              <Button size="lg" variant="outline" className="gap-2" onClick={handleExportCsv}>
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            )}
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              <Link href="/invoices/new">Create Invoice</Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8 p-4 bg-muted/40 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium">
              Status:
            </label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Invoice["status"] | "ALL")}>
              <SelectTrigger id="status-filter" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="customer-filter" className="text-sm font-medium">
              Customer:
            </label>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger id="customer-filter" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {invoices.length === 0 ? (
          <EmptyState
            message="No invoices found"
            action={
              <Button asChild size="lg">
                <Link href="/invoices/new">Create Your First Invoice</Link>
              </Button>
            }
          />
        ) : (
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Invoice Number</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Total</TableHead>
                  <TableHead className="font-semibold text-right">Balance</TableHead>
                  <TableHead className="font-semibold">Due Date</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const customer = customers.find((c) => c.id === invoice.customerId)
                  return (
                    <TableRow key={invoice.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{customer?.name || "-"}</TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(invoice.total)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(invoice.balance)}</TableCell>
                      <TableCell>{invoice.dueDate ? formatDate(invoice.dueDate) : "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm" className="gap-1">
                          <Link href={`/invoices/${invoice.id}`}>
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {pagination && (
          <div className="mt-6 text-sm text-muted-foreground text-center">
            Showing {invoices.length} of {pagination.total} invoices
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

