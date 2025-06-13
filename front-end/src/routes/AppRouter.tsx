import type React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "../hooks/auth/useAuth"
import AppLayout from "../components/layout/AppLayout"

// // Public pages
// import HomePage from "../pages/public/HomePage"
// import AboutPage from "../pages/public/AboutPage"
// import ContactPage from "../pages/public/ContactPage"

// Auth pages
import LoginPage from "../pages/auth/LoginPage"
import RegisterPage from "../pages/auth/RegisterPage"
import HomePage from "../pages/public/HompPage" 
// import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage"


const AppRouter: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<HomePage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default AppRouter
