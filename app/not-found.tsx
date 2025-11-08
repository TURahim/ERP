import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="container py-16">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="text-6xl font-bold text-muted-foreground mb-4">404</div>
            <CardTitle className="text-2xl">Page Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <Button asChild size="lg" className="gap-2">
                <Link href="/">
                  <Home className="w-4 h-4" />
                  Go Home
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="gap-2">
                <Link href="/customers">
                  <Search className="w-4 h-4" />
                  Browse Customers
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

