"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { Label } from "@/components/ui/label"

const numericValidation = (label: string) =>
  z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (value === "") {
        return
      }

      const normalized = value.replace(/,/g, "")
      const parsed = Number(normalized)

      if (!Number.isFinite(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must be a valid number`,
        })
        return
      }

      if (parsed < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must be 0 or greater`,
        })
      }
    })

const lineItemFormSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: numericValidation("Quantity"),
  unitPrice: numericValidation("Unit price"),
})

const invoiceFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  lineItems: z.array(lineItemFormSchema).min(1, "At least one line item is required"),
  discount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
})

const lineItemSubmitSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().nonnegative("Quantity must be 0 or greater"),
  unitPrice: z.number().nonnegative("Unit price must be 0 or greater"),
  amount: z.number().nonnegative(),
})

const invoiceSubmitSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  lineItems: z.array(lineItemSubmitSchema).min(1, "At least one line item is required"),
  discount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
})

export type InvoiceFormData = z.infer<typeof invoiceSubmitSchema>
type InvoiceFormValues = z.infer<typeof invoiceFormSchema>

const parseNumericInput = (value: string | number | null | undefined) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (!value) {
    return 0
  }

  const normalized = value.replace(/,/g, "")
  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : 0
}

const mapLineItemToFormValues = (item: InvoiceLineItem): InvoiceFormValues["lineItems"][number] => ({
  id: item.id ?? "",
  description: item.description,
  quantity: item.quantity !== undefined && item.quantity !== null ? String(item.quantity) : "",
  unitPrice: item.unitPrice !== undefined && item.unitPrice !== null ? String(item.unitPrice) : "",
})

const createEmptyLineItem = (): InvoiceFormValues["lineItems"][number] => ({
  id: "",
  description: "",
  quantity: "",
  unitPrice: "",
})

interface InvoiceFormProps {
  initialData?: Partial<Invoice>
  onSubmit: (data: InvoiceFormData) => Promise<void>
  isLoading?: boolean
}

export function InvoiceForm({ initialData, onSubmit, isLoading = false }: InvoiceFormProps) {
  const { data: customersData } = useCustomers({ includeInactive: false })
  const customers = customersData?.data ?? []

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customerId: initialData?.customerId ?? "",
      lineItems:
        initialData?.lineItems && initialData.lineItems.length > 0
          ? initialData.lineItems.map(mapLineItemToFormValues)
          : [createEmptyLineItem()],
      discount: initialData?.discount ?? 0,
      notes: initialData?.notes ?? "",
      dueDate: initialData?.dueDate ?? "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  })

  const watchedLineItems = form.watch("lineItems") ?? []
  const watchedDiscount = form.watch("discount") ?? 0

  const subtotal = watchedLineItems.reduce((sum, item) => {
    const quantity = parseNumericInput(item?.quantity)
    const unitPrice = parseNumericInput(item?.unitPrice)
    return sum + quantity * unitPrice
  }, 0)

  const total = Math.max(0, subtotal - watchedDiscount)

  const handleFormSubmit = form.handleSubmit(async (values) => {
    const preparedLineItems = values.lineItems.map((item) => {
      const quantity = parseNumericInput(item.quantity)
      const unitPrice = parseNumericInput(item.unitPrice)

      return {
        id: item.id || undefined,
        description: item.description,
        quantity,
        unitPrice,
        amount: quantity * unitPrice,
      }
    })

    const payload = invoiceSubmitSchema.parse({
      ...values,
      lineItems: preparedLineItems,
      discount: values.discount ?? 0,
    })

    await onSubmit(payload)
  })

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{initialData?.id ? "Edit Invoice" : "Create Invoice"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  onClick={() => append(createEmptyLineItem())}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Line Item
                </Button>
              </div>

              <div className="hidden md:grid md:grid-cols-[2fr,1fr,1fr,1fr] gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
                <div>Description</div>
                <div>Quantity</div>
                <div>Unit Price</div>
                <div className="text-right">Amount</div>
              </div>

              <div className="space-y-4">
                {fields.map((lineItemField, index) => {
                  const quantityValue = watchedLineItems[index]?.quantity
                  const unitPriceValue = watchedLineItems[index]?.unitPrice
                  const amountValue = parseNumericInput(quantityValue) * parseNumericInput(unitPriceValue)

                  const descriptionFieldId = `lineItems.${index}.description`
                  const quantityFieldId = `lineItems.${index}.quantity`
                  const unitPriceFieldId = `lineItems.${index}.unitPrice`
                  const amountFieldId = `lineItems.${index}.amount`

                  return (
                    <div key={lineItemField.id} className="grid gap-4 md:grid-cols-[2fr,1fr,1fr,1fr] items-start p-4 border rounded-lg">
                      <FormField
                        control={form.control}
                        name={`lineItems.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <Label htmlFor={descriptionFieldId}>Description</Label>
                            <FormControl>
                              <Input
                                id={descriptionFieldId}
                                placeholder="Description"
                                {...field}
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
                        name={`lineItems.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <Label htmlFor={quantityFieldId}>Quantity</Label>
                            <FormControl>
                              <Input
                                id={quantityFieldId}
                                type="text"
                                inputMode="decimal"
                                pattern="^[0-9]*[.,]?[0-9]*$"
                                placeholder="e.g. 2"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                onBlur={(e) => {
                                  field.onBlur()
                                  const cleaned = e.target.value.trim()
                                  if (!cleaned) {
                                    field.onChange("")
                                    return
                                  }
                                  const normalized = cleaned.replace(/,/g, "")
                                  const parsed = Number(normalized)
                                  field.onChange(Number.isFinite(parsed) ? String(parsed) : "")
                                }}
                                onFocus={(e) => e.target.select()}
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
                        name={`lineItems.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <Label htmlFor={unitPriceFieldId}>Unit Price</Label>
                            <FormControl>
                              <Input
                                id={unitPriceFieldId}
                                type="text"
                                inputMode="decimal"
                                pattern="^[0-9]*[.,]?[0-9]*$"
                                placeholder="e.g. 49.99"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                onBlur={(e) => {
                                  field.onBlur()
                                  const cleaned = e.target.value.trim()
                                  if (!cleaned) {
                                    field.onChange("")
                                    return
                                  }
                                  const normalized = cleaned.replace(/,/g, "")
                                  const parsed = Number(normalized)
                                  field.onChange(Number.isFinite(parsed) ? String(parsed) : "")
                                }}
                                onFocus={(e) => e.target.select()}
                                disabled={isLoading}
                                className="rounded-md"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="space-y-2">
                        <Label htmlFor={amountFieldId}>Amount</Label>
                        <div className="flex items-end gap-2">
                          <Input
                            id={amountFieldId}
                            value={formatCurrency(amountValue)}
                            readOnly
                            aria-readonly="true"
                            className="text-right font-medium bg-muted"
                          />
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              disabled={isLoading}
                              aria-label="Remove line item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
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

