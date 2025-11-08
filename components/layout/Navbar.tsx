"use client"

import Link from "next/link"
import { useAuth } from "@/lib/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LogOut, LogIn } from "lucide-react"

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <nav className="border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-bold text-xl text-primary">
          InvoiceMe
        </Link>

        {isAuthenticated && (
          <div className="flex items-center gap-8">
            <div className="flex gap-8">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/customers"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Customers
              </Link>
              <Link
                href="/invoices"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Invoices
              </Link>
            </div>
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
              Demo Mode
            </Badge>
          </div>
        )}

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login" className="gap-2 flex items-center">
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
