import type React from "react"
export function EmptyState({
  message = "No data found",
  action,
}: {
  message?: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-dashed p-12 text-center">
      <h3 className="text-lg font-semibold">{message}</h3>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
