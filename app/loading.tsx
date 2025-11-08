import { CardSkeleton } from "@/components/ui/card-skeleton"

export default function Loading() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}

