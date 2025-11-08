import type { Invoice } from "@/lib/types"

const variants: Record<Invoice["status"], "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  SENT: "default",
  PAID: "default",
}

const colors: Record<Invoice["status"], string> = {
  DRAFT: "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100",
  SENT: "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100",
  PAID: "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100",
}

export function StatusBadge({ status }: { status: Invoice["status"] }) {
  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${colors[status]}`}>
      {status}
    </div>
  )
}
