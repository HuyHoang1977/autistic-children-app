import type React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "../hooks/auth/useAuth"
import AppLayout from "../components/layout/AppLayout"

// Auth pages
import LoginPage from "../pages/auth/LoginPage"
import RegisterPage from "../pages/auth/RegisterPage"
import HomePage from "../pages/public/HompPage"

// Articles pages
import ArticlesListPage from "../pages/articles/ArticlesListPage"
import CreateArticlePage from "../pages/articles/CreateArticlePage"
import ArticleDetailPage from "../pages/articles/ArticleDetailPage" // ✅ UNCOMMENT: Import ArticleDetailPage
// import EditArticlePage from "../pages/articles/EditArticlePage" // Uncomment when ready

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

            {/* Articles routes */}
            <Route path="/articles" element={<ArticlesListPage />} />
            <Route path="/articles/create" element={<CreateArticlePage />} />

            {/* ✅ UNCOMMENT: Article detail route */}
            <Route path="/articles/:id" element={<ArticleDetailPage />} />

            {/* Future article routes - uncomment when pages are ready */}
            {/* <Route path="/articles/:id/edit" element={<EditArticlePage />} /> */}
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default AppRouter