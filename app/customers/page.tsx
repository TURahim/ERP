"use client"

import { useState } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useCustomers } from "@/lib/hooks/useCustomers"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Plus, Edit2, Eye, Download } from "lucide-react"
import { exportCustomersToCsv } from "@/lib/utils/csv"
import { useToast } from "@/hooks/use-toast"

export default function CustomersPage() {
  const [includeInactive, setIncludeInactive] = useState(false)
  const { data, isLoading } = useCustomers({ includeInactive, page: 0, size: 1000 }) // Fetch more for export
  const { toast } = useToast()

  const customers = data?.data ?? []
  const pagination = data?.pagination

  const handleExportCsv = () => {
    if (customers.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no customers to export.",
        variant: "destructive",
      })
      return
    }

    try {
      exportCustomersToCsv(customers)
      toast({
        title: "Export successful",
        description: `Exported ${customers.length} customer(s) to CSV`,
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export customers. Please try again.",
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
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground mt-2">Manage and track all your customer information</p>
          </div>
          <div className="flex gap-3">
            {customers.length > 0 && (
              <Button size="lg" variant="outline" className="gap-2" onClick={handleExportCsv}>
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            )}
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              <Link href="/customers/new">Create Customer</Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-8 p-4 bg-muted/40 rounded-lg border border-border">
          <input
            type="checkbox"
            id="inactive"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded cursor-pointer"
          />
          <label htmlFor="inactive" className="text-sm font-medium cursor-pointer">
            Show inactive customers
          </label>
        </div>

        {customers.length === 0 ? (
          <EmptyState
            message="No customers found"
            action={
              <Button asChild size="lg">
                <Link href="/customers/new">Create Your First Customer</Link>
              </Button>
            }
          />
        ) : (
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-muted-foreground">{customer.email || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={customer.isActive ? "default" : "secondary"}>
                        {customer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button asChild variant="ghost" size="sm" className="gap-1">
                          <Link href={`/customers/${customer.id}`}>
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="gap-1">
                          <Link href={`/customers/${customer.id}/edit`}>
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {pagination && (
          <div className="mt-6 text-sm text-muted-foreground text-center">
            Showing {customers.length} of {pagination.total} customers
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
