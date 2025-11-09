import { type NextRequest, NextResponse } from "next/server"

// Server-side environment variables (not exposed to client)
// These should be set in .env.local for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "http://localhost:8080"
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY || "demo-api-key-12345"

async function proxy(request: NextRequest, init: RequestInit = {}) {
  const url = new URL(request.url)
  const target = `${API_BASE_URL}${url.pathname.replace("/api/backend", "")}${url.search}`

  const body = init.body ?? (request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined)

  const response = await fetch(target, {
    ...init,
    body,
    headers: {
      ...Object.fromEntries(request.headers),
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  const responseBody = await response.text()
  return new NextResponse(responseBody, {
    status: response.status,
    headers: response.headers,
  })
}

export const GET = (request: NextRequest) => proxy(request, { method: "GET" })
export const POST = (request: NextRequest) => proxy(request, { method: "POST" })
export const PUT = (request: NextRequest) => proxy(request, { method: "PUT" })
export const PATCH = (request: NextRequest) => proxy(request, { method: "PATCH" })
export const DELETE = (request: NextRequest) => proxy(request, { method: "DELETE" })
