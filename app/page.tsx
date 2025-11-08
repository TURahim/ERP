"use client"

import Link from "next/link"
import { useAuth } from "@/lib/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp, Users, FileText } from "lucide-react"

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-bold text-pretty">
              <span className="text-primary">Invoice Management</span>
              <br />
              Made Simple
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A modern, intuitive platform for managing invoices, customers, and payments. Built for businesses that
              value simplicity and precision.
            </p>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Button size="lg" className="gap-2">
              <Link href={isAuthenticated ? "/dashboard" : "/signup"} className="flex items-center gap-2">
                {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline">
              <Link href="/customers">View Demo</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-24">
          <div className="bg-card border border-border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Customer Management</h3>
            <p className="text-sm text-muted-foreground">
              Organize and track all your customer information in one centralized place.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Invoice Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Create, send, and track invoices with real-time status updates and history.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Financial Insights</h3>
            <p className="text-sm text-muted-foreground">
              Get actionable insights into your revenue, payments, and outstanding balances.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
