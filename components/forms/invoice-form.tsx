"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCustomers } from "@/lib/hooks/useCustomers"
import { Plus, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils/formatting"
import type { Invoice, InvoiceLineItem } from "@/lib/types"

const lineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unitPrice: z.number().nonnegative("Unit price must be 0 or greater"),
  amount: z.number().nonnegative(),
})

const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  discount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
})

export type InvoiceFormData = z.infer<typeof invoiceSchema>

interface InvoiceFormProps {
  initialData?: Partial<Invoice>
  onSubmit: (data: InvoiceFormData) => Promise<void>
  isLoading?: boolean
}

export function InvoiceForm({ initialData, onSubmit, isLoading = false }: InvoiceFormProps) {
  const { data: customersData } = useCustomers({ includeInactive: false })
  const customers = customersData?.data ?? []

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: initialData?.customerId ?? "",
      lineItems:
        initialData?.lineItems && initialData.lineItems.length > 0
          ? initialData.lineItems.map((item) => ({
              id: item.id || "",
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            }))
          : [{ id: "", description: "", quantity: 1, unitPrice: 0, amount: 0 }],
      discount: 0,
      notes: initialData?.notes ?? "",
      dueDate: initialData?.dueDate ?? "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  })

  const watchedLineItems = form.watch("lineItems")
  const watchedDiscount = form.watch("discount") || 0

  // Memoize the dependency string to prevent unnecessary re-renders
  const lineItemsKey = useMemo(() => {
    return watchedLineItems.map((item, idx) => `${idx}-${item.quantity}-${item.unitPrice}`).join('|')
  }, [watchedLineItems])

  // Update line item amounts when quantity or unitPrice changes
  const updateLineItemAmount = (index: number) => {
    const item = watchedLineItems[index]
    if (item) {
      const amount = item.quantity * item.unitPrice
      form.setValue(`lineItems.${index}.amount`, amount, { shouldValidate: false })
    }
  }

  // Auto-update amounts when line items change
  useEffect(() => {
    watchedLineItems.forEach((item, index) => {
      if (item && typeof item.quantity === 'number' && typeof item.unitPrice === 'number') {
        const calculatedAmount = item.quantity * item.unitPrice
        const currentAmount = form.getValues(`lineItems.${index}.amount`)
        if (Math.abs(currentAmount - calculatedAmount) > 0.01) {
          form.setValue(`lineItems.${index}.amount`, calculatedAmount, { shouldValidate: false, shouldDirty: false })
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineItemsKey])

  // Calculate subtotal from watched values (no setValue during render)
  const subtotal = watchedLineItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice)
  }, 0)

  const total = Math.max(0, subtotal - watchedDiscount)

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{initialData?.id ? "Edit Invoice" : "Create Invoice"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-md" disabled={isLoading}>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel>Line Items *</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ id: "", description: "", quantity: 1, unitPrice: 0, amount: 0 })}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Line Item
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid gap-4 md:grid-cols-[2fr,1fr,1fr,auto] items-start p-4 border rounded-lg">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Description" {...field} disabled={isLoading} className="rounded-md" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0
                                field.onChange(value)
                              }}
                              disabled={isLoading}
                              className="rounded-md"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium min-w-[80px] text-right">
                        {formatCurrency((watchedLineItems[index]?.quantity || 0) * (watchedLineItems[index]?.unitPrice || 0))}
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                        className="rounded-md"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isLoading} className="rounded-md" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." {...field} disabled={isLoading} className="rounded-md min-h-24 resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-md border p-4 bg-muted/30">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {watchedDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-destructive">-{formatCurrency(watchedDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading} size="lg" className="min-w-32">
                {isLoading ? "Saving..." : initialData?.id ? "Update Invoice" : "Create Invoice"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

