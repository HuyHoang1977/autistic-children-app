"use client"

import type React from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../hooks/auth/useAuth"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  allowedRoles?: number[]
  redirectPath?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles = [], redirectPath = "/login" }) => {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />
  }

  if (
    allowedRoles.length > 0 &&
    user &&
    (typeof user.role_id === "undefined" || !allowedRoles.includes(user.role_id))
  ) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export default ProtectedRoute