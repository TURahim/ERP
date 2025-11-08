"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useService } from "@/lib/services/contracts"
import type { CreateCustomerRequest, UpdateCustomerRequest } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export function useCustomers(params?: { includeInactive?: boolean; page?: number; size?: number }) {
  const customerService = useService("customers")
  const page = params?.page ?? 0
  const size = params?.size ?? 20

  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => customerService.list({ page, size, includeInactive: params?.includeInactive }),
  })
}

export function useCustomer(id: string) {
  const customerService = useService("customers")
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => customerService.get(id),
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  const customerService = useService("customers")
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: CreateCustomerRequest) => customerService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      toast({
        title: "Success",
        description: "Customer created successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create customer",
        variant: "destructive",
      })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  const customerService = useService("customers")
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCustomerRequest }) =>
      customerService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["customers", variables.id] })
      toast({
        title: "Success",
        description: "Customer updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update customer",
        variant: "destructive",
      })
    },
  })
}

export function useDeactivateCustomer() {
  const queryClient = useQueryClient()
  const customerService = useService("customers")
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => customerService.deactivate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["customers", id] })
      toast({
        title: "Success",
        description: "Customer deactivated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to deactivate customer",
        variant: "destructive",
      })
    },
  })
}
