/**
 * CSV Export Utilities
 * Functions to convert data to CSV format and trigger downloads
 */

import type { Customer, Invoice } from "@/lib/types"

/**
 * Escapes CSV field values to handle commas, quotes, and newlines
 */
function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return ""
  }

  const stringValue = String(value)

  // If the value contains comma, quote, or newline, wrap it in quotes and escape quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Converts an array of objects to CSV format
 */
function arrayToCsv<T extends Record<string, any>>(
  data: T[],
  headers: { key: keyof T; label: string }[]
): string {
  // Create header row
  const headerRow = headers.map((h) => escapeCsvField(h.label)).join(",")

  // Create data rows
  const dataRows = data.map((item) =>
    headers.map((h) => escapeCsvField(item[h.key])).join(",")
  )

  // Combine header and data rows
  return [headerRow, ...dataRows].join("\n")
}

/**
 * Triggers a browser download of a CSV file
 */
function downloadCsv(csvContent: string, filename: string): void {
  // Add BOM for Excel compatibility with special characters
  const BOM = "\uFEFF"
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })

  // Create download link
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up
  URL.revokeObjectURL(url)
}

/**
 * Exports customers to CSV
 */
export function exportCustomersToCsv(customers: Customer[]): void {
  const headers = [
    { key: "name" as keyof Customer, label: "Name" },
    { key: "email" as keyof Customer, label: "Email" },
    { key: "billingAddress" as keyof Customer, label: "Billing Address" },
    { key: "isActive" as keyof Customer, label: "Status" },
    { key: "createdAt" as keyof Customer, label: "Created Date" },
    { key: "updatedAt" as keyof Customer, label: "Last Updated" },
  ]

  // Transform data for CSV
  const csvData = customers.map((customer) => ({
    name: customer.name,
    email: customer.email || "",
    billingAddress: customer.billingAddress || "",
    isActive: customer.isActive ? "Active" : "Inactive",
    createdAt: customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "",
    updatedAt: customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : "",
  }))

  const csvContent = arrayToCsv(csvData, headers)
  const filename = `customers_export_${new Date().toISOString().split("T")[0]}.csv`
  downloadCsv(csvContent, filename)
}

/**
 * Exports invoices to CSV
 */
export function exportInvoicesToCsv(invoices: Invoice[], customerMap?: Map<string, string>): void {
  const headers = [
    { key: "invoiceNumber" as keyof Invoice, label: "Invoice Number" },
    { key: "customerId" as keyof Invoice, label: "Customer Name" },
    { key: "status" as keyof Invoice, label: "Status" },
    { key: "total" as keyof Invoice, label: "Total Amount" },
    { key: "balance" as keyof Invoice, label: "Outstanding Balance" },
    { key: "discount" as keyof Invoice, label: "Discount" },
    { key: "dueDate" as keyof Invoice, label: "Due Date" },
    { key: "createdAt" as keyof Invoice, label: "Created Date" },
    { key: "updatedAt" as keyof Invoice, label: "Last Updated" },
  ]

  // Transform data for CSV
  const csvData = invoices.map((invoice) => ({
    invoiceNumber: invoice.invoiceNumber,
    customerId: customerMap?.get(invoice.customerId) || invoice.customerId,
    status: invoice.status,
    total: invoice.total.toFixed(2),
    balance: invoice.balance.toFixed(2),
    discount: (invoice.discount || 0).toFixed(2),
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "",
    createdAt: invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : "",
    updatedAt: invoice.updatedAt ? new Date(invoice.updatedAt).toLocaleDateString() : "",
  }))

  const csvContent = arrayToCsv(csvData, headers)
  const filename = `invoices_export_${new Date().toISOString().split("T")[0]}.csv`
  downloadCsv(csvContent, filename)
}

/**
 * Generic CSV export function for any data
 */
export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  headers: { key: keyof T; label: string }[],
  filename: string
): void {
  const csvContent = arrayToCsv(data, headers)
  downloadCsv(csvContent, filename)
}

