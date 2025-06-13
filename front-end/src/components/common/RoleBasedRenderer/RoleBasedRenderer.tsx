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

export const RoleBasedRenderer: React.FC<RoleBasedRendererProps> = ({
  adminVariant,
  doctorVariant,
  parentVariant,
  guestVariant,
  fallback = null,
  allowedRoles,
  children,
}) => {
  const { user } = useAuth()

  const wrap = (node: React.ReactNode) =>
    node === null || node === undefined ? null : <>{node}</>

  if (!user) {
    return wrap(guestVariant || children || fallback)
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return wrap(fallback)
    }
  }

  if (children && (!allowedRoles || allowedRoles.includes(user.role))) {
    return wrap(children)
  }

  switch (user.role) {
    case UserRole.ADMIN:
      return wrap(adminVariant || children || fallback)
    case UserRole.DOCTOR:
      return wrap(doctorVariant || children || fallback)
    case UserRole.PARENT:
      return wrap(parentVariant || children || fallback)
    case UserRole.GUEST:
      return wrap(guestVariant || children || fallback)
    default:
      return wrap(fallback)
  }
}