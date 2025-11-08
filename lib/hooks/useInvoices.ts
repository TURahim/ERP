"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useService } from "@/lib/services/contracts"
import type { CreateInvoiceRequest, UpdateInvoiceRequest } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export function useInvoices(params?: {
  status?: "DRAFT" | "SENT" | "PAID"
  customerId?: string
  page?: number
  size?: number
}) {
  const invoiceService = useService("invoices")
  const page = params?.page ?? 0
  const size = params?.size ?? 20

  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () =>
      invoiceService.list({
        page,
        size,
        status: params?.status,
        customerId: params?.customerId,
      }),
  })
}

export function useInvoice(id: string) {
  const invoiceService = useService("invoices")
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => invoiceService.get(id),
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  const invoiceService = useService("invoices")
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: CreateInvoiceRequest) => invoiceService.create(payload),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      queryClient.invalidateQueries({ queryKey: ["customers", invoice.customerId] })
      toast({
        title: "Success",
        description: "Invoice created successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create invoice",
        variant: "destructive",
      })
    },
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  const invoiceService = useService("invoices")
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInvoiceRequest }) =>
      invoiceService.update(id, payload),
    onSuccess: (invoice, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      queryClient.invalidateQueries({ queryKey: ["invoices", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["customers", invoice.customerId] })
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update invoice",
        variant: "destructive",
      })
    },
  })
}

export function useSendInvoice() {
  const queryClient = useQueryClient()
  const invoiceService = useService("invoices")
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => invoiceService.send(id),
    onSuccess: (invoice, id) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      queryClient.invalidateQueries({ queryKey: ["invoices", id] })
      queryClient.invalidateQueries({ queryKey: ["customers", invoice.customerId] })
      toast({
        title: "Success",
        description: "Invoice sent successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to send invoice",
        variant: "destructive",
      })
    },
  })
}

export function useInvoicePayments(invoiceId: string) {
  const invoiceService = useService("invoices")
  return useQuery({
    queryKey: ["invoices", invoiceId, "payments"],
    queryFn: () => invoiceService.getPayments(invoiceId),
    enabled: !!invoiceId,
  })
}

