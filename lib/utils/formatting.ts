/**
 * Currency formatting utilities
 * Uses Intl.NumberFormat for locale-aware formatting
 * Supports future i18n by accepting locale parameter
 */

export function formatCurrency(amount: number, locale: string = "en-US", currency: string = "USD"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount)
}

/**
 * Date formatting utilities
 * Uses Intl.DateTimeFormat for locale-aware formatting
 */

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
  return dateObj.toLocaleDateString("en-US", options || defaultOptions)
}

export function formatDateTime(date: string | Date, locale: string = "en-US"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDateLong(date: string | Date, locale: string = "en-US"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

