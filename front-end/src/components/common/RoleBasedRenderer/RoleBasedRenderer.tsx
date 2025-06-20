"use client"

import type React from "react"
import { useAuth } from "../../../hooks/auth/useAuth"
import {
  isAdminUser,
  isDoctorUser,
  isParentUser,
  isGuestUser,
  ROLE_ADMIN,
  ROLE_DOCTOR,
  ROLE_PARENT,
} from "../../../types/user.types"

interface RoleBasedRendererProps {
  adminVariant?: React.ReactNode
  doctorVariant?: React.ReactNode
  parentVariant?: React.ReactNode
  guestVariant?: React.ReactNode
  fallback?: React.ReactNode
  allowedRoles?: number[]
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

  // allowedRoles: kiểm tra role_id
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user.role_id || !allowedRoles.includes(user.role_id)) {
      return wrap(fallback)
    }
  }

  if (children && (!allowedRoles || (user.role_id && allowedRoles.includes(user.role_id)))) {
    return wrap(children)
  }

  if (isAdminUser(user)) {
    return wrap(adminVariant || children || fallback)
  }
  if (isDoctorUser(user)) {
    return wrap(doctorVariant || children || fallback)
  }
  if (isParentUser(user)) {
    return wrap(parentVariant || children || fallback)
  }
  if (isGuestUser(user)) {
    return wrap(guestVariant || children || fallback)
  }

  return wrap(fallback);
}