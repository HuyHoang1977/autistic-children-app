import type React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "../hooks/auth/useAuth"
import AppLayout from "../components/layout/AppLayout"
import ProtectedRoute from "../routes/ProtectedRoute"

// Auth pages
import LoginPage from "../pages/auth/LoginPage"
import RegisterPage from "../pages/auth/RegisterPage"
import HomePage from "../pages/public/HomePage/HomePage"
import ProfilePage from "../pages/profile/ProfilePage"
import DoctorsPage from "../pages/public/DoctorPage/DoctorPage"
import DoctorDetailPage from "../pages/public/DoctorPage/DoctorDetailPage"

// Articles pages
import ArticlesListPage from "../pages/articles/ArticlesListPage"
import CreateArticlePage from "../pages/articles/CreateArticlePage"
import ArticleDetailPage from "../pages/articles/ArticleDetailPage"

// Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard"

const AppRouter: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/doctors/:id" element={<DoctorDetailPage />} />

            {/* Articles routes */}
            <Route path="/articles" element={<ArticlesListPage />} />
            <Route path="/articles/:id" element={<ArticleDetailPage />} />

            {/* Protected Articles routes */}
            <Route path="/articles/create" element={
              <ProtectedRoute>
                <CreateArticlePage />
              </ProtectedRoute>
            } />

            {/* ✅ Admin routes - Protected for Admin only */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* ✅ Alternative: Using legacy allowedRoles prop */}
            {/* <Route path="/admin" element={
              <ProtectedRoute allowedRoles={[1]}>
                <AdminDashboard />
              </ProtectedRoute>
            } /> */}

            {/* Future routes - uncomment when pages are ready */}
            {/* <Route path="/articles/:id/edit" element={
              <ProtectedRoute>
                <EditArticlePage />
              </ProtectedRoute>
            } /> */}
            {/* <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } /> */}
            {/* <Route path="/doctors" element={<DoctorsListPage />} /> */}

            {/* Unauthorized page */}
            <Route path="/unauthorized" element={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">403 - Unauthorized</h1>
                  <p className="text-gray-600 mb-4">Bạn không có quyền truy cập trang này.</p>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Về trang chủ
                  </button>
                </div>
              </div>
            } />

            {/* 404 Page */}
            <Route path="*" element={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">404 - Không tìm thấy trang</h1>
                  <p className="text-gray-600 mb-4">Trang bạn đang tìm kiếm không tồn tại.</p>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Về trang chủ
                  </button>
                </div>
              </div>
            } />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default AppRouter