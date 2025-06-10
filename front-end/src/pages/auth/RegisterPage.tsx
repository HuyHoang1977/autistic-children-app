// RegisterPage.tsx
"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ArrowLeft, Heart, Stethoscope } from "lucide-react";
import RegisterForm from "../../components/forms/RegisterForm";

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Back to home */}
        <Link
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Về trang chủ
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Đăng ký tài khoản</CardTitle>
            <CardDescription>Tham gia cộng đồng Healthcare Platform</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs className="w-full">
              <RegisterForm />
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
