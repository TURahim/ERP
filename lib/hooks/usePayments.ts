"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useService } from "@/lib/services/contracts"
import type { CreatePaymentRequest } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export function usePayment(id: string) {
  const paymentService = useService("payments")
  return useQuery({
    queryKey: ["payments", id],
    queryFn: () => paymentService.get(id),
    enabled: !!id,
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()
  const paymentService = useService("payments")
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: CreatePaymentRequest) => paymentService.create(payload),
    onSuccess: (payment) => {
      // Invalidate invoice queries to update balance
      queryClient.invalidateQueries({ queryKey: ["invoices", payment.invoiceId] })
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      // Invalidate payment queries for this invoice
      queryClient.invalidateQueries({ queryKey: ["invoices", payment.invoiceId, "payments"] })
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to record payment",
        variant: "destructive",
      })
    },
  })
}

