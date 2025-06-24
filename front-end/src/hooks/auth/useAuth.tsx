"use client"

import type React from "react"
import { useState, useEffect, useContext, createContext, type ReactNode, useCallback } from "react"
import { type User, type LoginRequest, type RegisterRequest, ROLE_ADMIN, ROLE_PARENT, ROLE_DOCTOR } from "../../types/user.types"
import { authService } from "../../api/services/auth.service"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  hasRole: (roles: number | number[]) => boolean
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
    (roles: number | number[]): boolean => {
      if (!user || user.role_id === 0) return false

      if (Array.isArray(roles)) {
        return roles.includes(user.role_id!)
      }

      return user.role_id === roles
    },
    [user],
  )

  const updateUser = useCallback(
    (userData: Partial<User>): void => {
      if (user) {
        setUser(prevUser => {
          if (!prevUser) return prevUser
          // Ensure the role_id stays the same and only allowed fields are updated
          if (prevUser.role_id === ROLE_PARENT) {
            return { ...prevUser, ...userData, role_id: ROLE_PARENT }
          }
          if (prevUser.role_id === ROLE_DOCTOR) {
            return { ...prevUser, ...userData, role_id: ROLE_DOCTOR }
          }
          if (prevUser.role_id === ROLE_ADMIN) {
            return { ...prevUser, ...userData, role_id: ROLE_ADMIN }
          }
          return prevUser
        })
      }
    },
    [user],
  )

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && user.role_id !== 0,
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