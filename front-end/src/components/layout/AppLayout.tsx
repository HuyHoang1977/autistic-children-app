"use client"

import type React from "react"
import { Outlet } from "react-router-dom"
import Header from "./header/header"
import Sidebar from "./sidebar/sidebar"
import Footer from "./footer/footer"
import { useAuth } from "../../hooks/auth/useAuth"
import { SidebarProvider, SidebarInset } from "../ui/sidebar"

const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuth()

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex flex-col bg-gray-50 w-full">
        <Header />

        <div className="flex flex-1">
          {isAuthenticated && <Sidebar />}

          <SidebarInset className="flex-1">
            <div className="min-h-[calc(100vh-4rem)]">
              <Outlet />
            </div>
            <Footer />
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default AppLayout