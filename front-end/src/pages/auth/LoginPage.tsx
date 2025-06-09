"use client"

import React from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { ArrowLeft } from "lucide-react"
import LoginForm from "../../components/forms/LoginForm"

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || "/"

  const handleLoginSuccess = () => {
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Về trang chủ
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Đăng nhập</CardTitle>
            <CardDescription>Đăng nhập vào tài khoản Healthcare Platform của bạn</CardDescription>
          </CardHeader>

          <CardContent>
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage;