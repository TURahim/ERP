"use client"

import { useMemo } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, TrendingUp } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useCustomers } from "@/lib/hooks/useCustomers"
import { useInvoices } from "@/lib/hooks/useInvoices"
import { formatCurrency } from "@/lib/utils/formatting"

const DEMO_METRICS = {
  totalCustomers: 42,
  totalInvoices: 156,
  outstandingBalance: 42500,
  customersSubtitle: "8 new this month",
  invoicesSubtitle: "28 sent this month",
  balanceSubtitle: "15% of total invoiced",
}

export default function DashboardPage() {
  const { user } = useAuth()
  const isDemoUser = user?.email === "demo@invoiceme.com"

  const { data: customerData, isLoading: customersLoading } = useCustomers({
    includeInactive: true,
    page: 0,
    size: 1,
  })
  const { data: invoiceData, isLoading: invoicesLoading } = useInvoices({
    page: 0,
    size: 100,
  })

  const outstandingBalance = useMemo(() => {
    if (!invoiceData?.data) return 0
    return invoiceData.data.reduce((sum, invoice) => sum + (invoice.balance ?? 0), 0)
  }, [invoiceData])

  const metrics = useMemo(() => {
    if (isDemoUser) {
      return DEMO_METRICS
    }

    const totalCustomers =
      customerData?.pagination?.total ?? customerData?.data?.length ?? 0
    const totalInvoices =
      invoiceData?.pagination?.total ?? invoiceData?.data?.length ?? 0

    return {
      totalCustomers,
      totalInvoices,
      outstandingBalance,
      customersSubtitle:
        totalCustomers === 0
          ? "Add your first customer to get started"
          : `${totalCustomers} total`,
      invoicesSubtitle:
        totalInvoices === 0
          ? "No invoices yet"
          : `${totalInvoices} total`,
      balanceSubtitle:
        outstandingBalance === 0
          ? "No outstanding balance"
          : "Keep an eye on pending invoices",
    }
  }, [customerData, invoiceData, isDemoUser, outstandingBalance])

  const isLoading = !isDemoUser && (customersLoading || invoicesLoading)

  return (
    <ProtectedRoute>
      <div className="container py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back. Here&apos;s your financial overview.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">
                {isLoading ? "…" : metrics.totalCustomers}
              </div>
              <p className="text-xs text-muted-foreground">{metrics.customersSubtitle}</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">
                {isLoading ? "…" : metrics.totalInvoices}
              </div>
              <p className="text-xs text-muted-foreground">{metrics.invoicesSubtitle}</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-shadow md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-accent">
                {isLoading ? "…" : formatCurrency(metrics.outstandingBalance)}
              </div>
              <p className="text-xs text-muted-foreground">{metrics.balanceSubtitle}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
