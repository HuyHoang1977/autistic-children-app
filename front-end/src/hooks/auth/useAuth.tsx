"use client"

import type React from "react"
import { useState, useEffect, useContext, createContext, type ReactNode, useCallback } from "react"
import { type User, UserRole, type LoginRequest, type RegisterRequest } from "../../types"
import { authService } from "../../api/services/auth.service"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  hasRole: (roles: UserRole | UserRole[]) => boolean
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const initAuth = async (): Promise<void> => {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error("Auth initialization failed:", error)
        localStorage.removeItem("auth_token")
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true)
    try {
      const { user: userData } = await authService.login(credentials)
      setUser(userData)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (userData: RegisterRequest): Promise<void> => {
    setIsLoading(true)
    try {
      const { user: newUser } = await authService.register(userData)
      setUser(newUser)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      await authService.logout()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!user || user.role === UserRole.GUEST) return false

      if (Array.isArray(roles)) {
        return roles.includes(user.role)
      }

      return user.role === roles
    },
    [user],
  )

  const updateUser = useCallback(
    (userData: Partial<User>): void => {
      if (user) {
        setUser(prevUser => {
          if (!prevUser) return prevUser
          // Ensure type safety by updating only fields relevant to the user's role
          if (prevUser.role === UserRole.PARENT) {
            return { ...prevUser, ...userData } as User
          }
          if (prevUser.role === UserRole.DOCTOR) {
            return { ...prevUser, ...userData } as User
          }
          // Add more role checks if needed
          return prevUser
        })
      }
    },
    [user],
  )

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && user.role !== UserRole.GUEST,
    login,
    register,
    logout,
    hasRole,
    updateUser,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
