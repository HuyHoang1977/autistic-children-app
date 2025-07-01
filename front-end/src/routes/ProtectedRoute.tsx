"use client"

import type React from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../hooks/auth/useAuth"
import { Loader2, Shield, Lock, UserX, AlertCircle } from "lucide-react"

interface ProtectedRouteProps {
  allowedRoles?: number[]
  requiredRole?: 'admin' | 'doctor' | 'parent'
  redirectPath?: string
  children?: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles = [],
  requiredRole,
  redirectPath = "/login",
  children
}) => {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />
  }

  // ✅ NEW: Check role-based access using requiredRole prop
  if (requiredRole) {
    const userRole = getUserRole(user);

    if (!userRole || userRole !== requiredRole) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md w-full text-center">
            <div className="text-red-600 mb-4">
              {requiredRole === 'admin' ? (
                <Shield className="w-12 h-12 mx-auto" />
              ) : requiredRole === 'doctor' ? (
                <UserX className="w-12 h-12 mx-auto" />
              ) : (
                <Lock className="w-12 h-12 mx-auto" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Không có quyền truy cập
            </h2>
            <p className="text-gray-600 mb-4">
              {requiredRole === 'admin'
                ? 'Chỉ Admin mới có thể truy cập trang này.'
                : `Cần quyền ${getRoleDisplayName(requiredRole)} để truy cập trang này.`
              }
            </p>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  Vai trò hiện tại: <span className="font-medium text-gray-900">{getRoleDisplayName(userRole)}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Vai trò yêu cầu: <span className="font-medium text-red-600">{getRoleDisplayName(requiredRole)}</span>
                </p>
              </div>
              <div className="flex space-x-2 justify-center">
                <button
                  onClick={() => window.history.back()}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                >
                  Quay lại
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Về trang chủ
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // ✅ LEGACY: Check role-based access using allowedRoles prop (for backward compatibility)
  if (
    allowedRoles.length > 0 &&
    user &&
    (typeof user.role_id === "undefined" || !allowedRoles.includes(user.role_id))
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md w-full text-center">
          <div className="text-orange-600 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Truy cập bị từ chối
          </h2>
          <p className="text-gray-600 mb-4">
            Bạn không có quyền truy cập vào trang này.
          </p>
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                Role ID hiện tại: <span className="font-medium">{user.role_id || 'Không xác định'}</span>
              </p>
              <p className="text-sm text-gray-600">
                Role ID yêu cầu: <span className="font-medium text-red-600">{allowedRoles.join(', ')}</span>
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ✅ Render children if provided, otherwise render Outlet for nested routes
  return children ? <>{children}</> : <Outlet />
}

// ✅ Helper function to get user role from user object
const getUserRole = (user: any): string | null => {
  // Check role_id first (this is the most reliable)
  if (user.role_id === 1) return 'admin';
  if (user.role_id === 2) return 'doctor';
  if (user.role_id === 3) return 'parent';

  // Fallback to role_info if available
  if (user.role_info?.role_name) {
    const roleName = user.role_info.role_name.toLowerCase();
    if (roleName.includes('admin')) return 'admin';
    if (roleName.includes('doctor')) return 'doctor';
    if (roleName.includes('parent')) return 'parent';
  }

  // Check profile type
  if (user.admin_info || user.profile?.type === 'admin') return 'admin';
  if (user.doctor_info || user.profile?.type === 'doctor') return 'doctor';
  if (user.parent_info || user.profile?.type === 'parent') return 'parent';

  // Check user_type as fallback
  if (user.user_type === 1) return 'admin';
  if (user.user_type === 2) return 'doctor';
  if (user.user_type === 3) return 'parent';

  console.warn('Could not determine user role:', user);
  return null;
};

// ✅ Helper function to get display name for role
const getRoleDisplayName = (role: string | null): string => {
  switch (role) {
    case 'admin': return 'Quản trị viên';
    case 'doctor': return 'Bác sĩ';
    case 'parent': return 'Phụ huynh';
    default: return 'Không xác định';
  }
};

export default ProtectedRoute