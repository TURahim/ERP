"use client"

import type { PropsWithChildren } from "react"
import { useRequireAuth } from "@/lib/hooks/useRequireAuth"
import { CardSkeleton } from "@/components/ui/card-skeleton"

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { isLoading } = useRequireAuth()

  if (isLoading) {
    return <CardSkeleton />
  }

  return <>{children}</>
}
