"use client"

import type React from "react"

import { useAuth } from "../../../hooks/auth/useAuth"
import { UserRole } from "../../../types"

interface RoleBasedRendererProps {
  adminVariant?: React.ReactNode
  doctorVariant?: React.ReactNode
  parentVariant?: React.ReactNode
  guestVariant?: React.ReactNode
  fallback?: React.ReactNode
  allowedRoles?: UserRole[]
  children?: React.ReactNode
}

export const RoleBasedRenderer = ({
  adminVariant,
  doctorVariant,
  parentVariant,
  guestVariant,
  fallback = null,
  allowedRoles,
  children,
}: RoleBasedRendererProps): React.ReactElement | null => {
  const { user } = useAuth()

  if (!user) {
    return guestVariant ? <>{guestVariant}</> : children ? <>{children}</> : fallback ? <>{fallback}</> : null
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return fallback ? <>{fallback}</> : null
    }
    // If user has one of the allowed roles, continue to render based on specific role
  }

  if (children && (!allowedRoles || allowedRoles.includes(user.role))) {
    return <>{children}</>
  }

  switch (user.role) {
    case UserRole.ADMIN:
      return adminVariant ? <>{adminVariant}</> : children ? <>{children}</> : fallback ? <>{fallback}</> : null
    case UserRole.DOCTOR:
      return doctorVariant ? <>{doctorVariant}</> : children ? <>{children}</> : fallback ? <>{fallback}</> : null
    case UserRole.PARENT:
      return parentVariant ? <>{parentVariant}</> : children ? <>{children}</> : fallback ? <>{fallback}</> : null
    case UserRole.GUEST:
      return guestVariant ? <>{guestVariant}</> : children ? <>{children}</> : fallback ? <>{fallback}</> : null
    default:
      return fallback ? <>{fallback}</> : null
  }
}