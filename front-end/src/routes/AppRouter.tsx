import type React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "../hooks/auth/useAuth"

// // Public pages
// import HomePage from "../pages/public/HomePage"
// import AboutPage from "../pages/public/AboutPage"
// import ContactPage from "../pages/public/ContactPage"

// Auth pages
import LoginPage from "../pages/auth/LoginPage"
import RegisterPage from "../pages/auth/RegisterPage"
// import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage"


const AppRouter: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default AppRouter
