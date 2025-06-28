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
  refreshUser: () => Promise<void>
  userVersion: number // For forcing re-renders
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [userVersion, setUserVersion] = useState<number>(0) // Force re-render trigger

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
        setUserVersion(prev => prev + 1) // Trigger re-render
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
      setUserVersion(prev => prev + 1) // Trigger re-render
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (userData: RegisterRequest): Promise<void> => {
    setIsLoading(true)
    try {
      const { user: newUser } = await authService.register(userData)
      setUser(newUser)
      setUserVersion(prev => prev + 1) // Trigger re-render
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      await authService.logout()
      setUser(null)
      setUserVersion(prev => prev + 1) // Trigger re-render
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

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      console.log('🔄 Refreshing user data...')
      const currentUser = await authService.refreshCurrentUser()
      console.log('✅ User data refreshed:', currentUser)
      setUser(currentUser)
      setUserVersion(prev => prev + 1) // Trigger re-render
    } catch (error: any) {
      console.error("Failed to refresh user:", error)
      // If token is invalid, clear user
      if (error.response?.status === 401) {
        setUser(null)
        localStorage.removeItem("auth_token")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateUser = useCallback(
    (userData: Partial<User>): void => {
      if (user) {
        setUser(prevUser => {
          if (!prevUser) return prevUser
          
          // Create updated user with proper type handling
          const updatedUser = { 
            ...prevUser, 
            ...userData,
            // Always preserve the role_id and user_id to maintain type integrity
            role_id: prevUser.role_id,
            user_id: prevUser.user_id
          } as User
          
          console.log('🔄 User updated in context:', {
            old: prevUser,
            new: updatedUser,
            changes: userData
          })
          return updatedUser
        })
        setUserVersion(prev => prev + 1) // Trigger re-render
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
    refreshUser,
    userVersion,
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