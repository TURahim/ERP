"use client"

import { createContext, useContext, useState, useCallback, useEffect, type PropsWithChildren } from "react"

export interface User {
  id: string
  email: string
  name: string
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  loginAsDemo: () => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Failed to parse stored user:", error)
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    // Mock login - in production, call real API
    if (!email || !password) {
      throw new Error("Email and password are required")
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock user creation
    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name: email.split("@")[0],
    }

    setUser(newUser)
    localStorage.setItem("auth_user", JSON.stringify(newUser))
  }, [])

  const signup = useCallback(async (email: string, password: string, name: string) => {
    // Mock signup - in production, call real API
    if (!email || !password || !name) {
      throw new Error("All fields are required")
    }

    // Check if user already exists (mock validation)
    if (localStorage.getItem(`user_${email}`)) {
      throw new Error("User already exists")
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name,
    }

    setUser(newUser)
    localStorage.setItem("auth_user", JSON.stringify(newUser))
  }, [])

  const loginAsDemo = useCallback(async () => {
    // Demo account credentials - uses mock API data
    const demoUser: User = {
      id: "demo_user_001",
      email: "demo@invoiceme.com",
      name: "Demo User",
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    setUser(demoUser)
    localStorage.setItem("auth_user", JSON.stringify(demoUser))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("auth_user")
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        loginAsDemo,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
