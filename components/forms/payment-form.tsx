"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils/formatting"
import type { CreatePaymentRequest } from "@/lib/types"

const paymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  paymentMethod: z.enum(["Cash", "Card", "Wire", "ACH", "Check", "Other"]).optional(),
  notes: z.string().optional(),
})

export type PaymentFormData = z.infer<typeof paymentSchema>

interface PaymentFormProps {
  invoiceId: string
  maxAmount: number
  onSubmit: (data: CreatePaymentRequest) => Promise<void>
  isLoading?: boolean
}

export function PaymentForm({ invoiceId, maxAmount, onSubmit, isLoading = false }: PaymentFormProps) {
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: maxAmount,
      paymentMethod: undefined,
      notes: "",
    },
  })

  const watchedAmount = form.watch("amount")
  const isOverpayment = watchedAmount > maxAmount
  // Note: Idempotency key will be handled by the service layer when integrating with real backend

  const remainingBalance = maxAmount - (watchedAmount || 0)

  const handleSubmit = async (data: PaymentFormData) => {
    if (isOverpayment) {
      return
    }

    const payload: CreatePaymentRequest = {
      invoiceId,
      amount: data.amount,
      paymentMethod: data.paymentMethod || "Other",
    }

    await onSubmit(payload)
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      disabled={isLoading}
                      className="rounded-md"
                    />
                  </FormControl>
                  {isOverpayment && (
                    <p className="text-sm text-destructive font-medium">
                      Amount cannot exceed balance ({formatCurrency(maxAmount)})
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-md" disabled={isLoading}>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Credit/Debit Card</SelectItem>
                      <SelectItem value="Wire">Wire Transfer</SelectItem>
                      <SelectItem value="ACH">ACH</SelectItem>
                      <SelectItem value="Check">Check</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Check number, reference, etc."
                      {...field}
                      disabled={isLoading}
                      className="rounded-md min-h-24 resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-md border p-4 bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Remaining Balance After Payment:</span>
                <span className="text-lg font-bold">{formatCurrency(Math.max(0, remainingBalance))}</span>
              </div>
            </div>

            <Alert variant="default" className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-900">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                Payments cannot be edited or deleted after submission.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading || isOverpayment} size="lg" className="min-w-32">
                {isLoading ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

