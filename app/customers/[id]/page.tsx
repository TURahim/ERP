"use client"

import Link from "next/link"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCustomer } from "@/lib/hooks/useCustomers"
import { useParams } from "next/navigation"
import { formatDate } from "@/lib/utils/formatting"
import { ArrowLeft, Edit2, FileText } from "lucide-react"

export default function CustomerDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { data: customer, isLoading } = useCustomer(id)

  if (isLoading) return <div className="container py-8">Loading...</div>
  if (!customer) return <div className="container py-8">Customer not found</div>

  return (
    <ProtectedRoute>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="icon">
                <Link href="/customers">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{customer.name}</h1>
                <Badge className="mt-2" variant={customer.isActive ? "default" : "secondary"}>
                  {customer.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <Button asChild className="gap-2">
              <Link href={`/customers/${id}/edit`}>
                <Edit2 className="w-4 h-4" />
                Edit Customer
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
                  <p className="mt-2 text-base">{customer.email || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Billing Address
                  </label>
                  <p className="mt-2 text-base">{customer.billingAddress || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Created Date
                  </label>
                  <p className="mt-2 text-base">{formatDate(customer.createdAt)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Related Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">View all invoices associated with this customer</p>
                <Button asChild variant="outline" className="w-full gap-2 bg-transparent">
                  <Link href={`/invoices?customerId=${id}`}>
                    <FileText className="w-4 h-4" />
                    View Invoices
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
