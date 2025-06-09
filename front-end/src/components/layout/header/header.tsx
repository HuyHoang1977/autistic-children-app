"use client"

import type React from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../../ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu"
import { Badge } from "../../ui/badge"
import { Bell, Search, Menu, User, Settings, LogOut, Heart, BookOpen, Users, Sun, Moon } from "lucide-react"
import { useAuth } from "../../../hooks/auth/useAuth"
import { isDoctorUser, isGuestUser, UserRole } from "../../../types"
import { RoleBasedRenderer } from "../../common/RoleBasedRenderer/RoleBasedRenderer"
// import { useTheme } from "../../theme-provider"
import { useTheme } from "../../theme-provider"
import { SidebarTrigger } from "../../ui/sidebar"

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  const getDashboardLink = () => {
    if (!user) return "/"

    switch (user.role) {
      case UserRole.ADMIN:
        return "/admin"
      case UserRole.DOCTOR:
        return "/doctor"
      case UserRole.PARENT:
        return "/parent"
      default:
        return "/"
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Sidebar Trigger */}
          <div className="flex items-center gap-2">
            {isAuthenticated && <SidebarTrigger />}

            <Link to="/" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl">Healthcare</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/articles"
              className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Bài viết
            </Link>

            <RoleBasedRenderer
              parentVariant={
                <Link
                  to="/doctors"
                  className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Bác sĩ
                </Link>
              }
            />

            <Link to="/about" className="text-sm font-medium transition-colors hover:text-primary">
              Giới thiệu
            </Link>

            <Link to="/contact" className="text-sm font-medium transition-colors hover:text-primary">
              Liên hệ
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <Search className="h-4 w-4" />
            </Button>

            {/* Theme toggle */}
            <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <RoleBasedRenderer allowedRoles={[UserRole.PARENT, UserRole.DOCTOR, UserRole.ADMIN]} fallback={null}>
                  <Link to="/notifications">
                    <Button variant="ghost" size="sm" className="relative">
                      <Bell className="h-4 w-4" />
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
                      >
                        3
                      </Badge>
                    </Button>
                  </Link>
                </RoleBasedRenderer>

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user && !isGuestUser(user) ? user.avatar_url : "/placeholder.svg?height=32&width=32"}
                        />
                        <AvatarFallback>
                          {user && !isGuestUser(user) ? `${user.first_name?.charAt(0)}${user.last_name?.charAt(0)}` : "G"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        {user && !isGuestUser(user) && (
                          <>
                            <p className="text-sm font-medium leading-none">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {user.role === UserRole.DOCTOR && "Bác sĩ"}
                                {user.role === UserRole.PARENT && "Phụ huynh"}
                                {user.role === UserRole.ADMIN && "Quản trị viên"}
                              </Badge>
                              {user.role === UserRole.DOCTOR && isDoctorUser(user) && user.verified && (
                                <Badge variant="default" className="text-xs">
                                  ✓ Đã xác minh
                                </Badge>
                              )}
                            </div>
                          </>
                        )}
                        {(!user || isGuestUser(user)) && <p className="text-sm font-medium leading-none">Khách</p>}
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link to={getDashboardLink()} className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Hồ sơ cá nhân
                      </Link>
                    </DropdownMenuItem>

                    <RoleBasedRenderer
                      doctorVariant={
                        <DropdownMenuItem asChild>
                          <Link to="/doctor/articles" className="flex items-center">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Bài viết của tôi
                          </Link>
                        </DropdownMenuItem>
                      }
                      parentVariant={
                        <DropdownMenuItem asChild>
                          <Link to="/parent/saved-articles" className="flex items-center">
                            <Heart className="mr-2 h-4 w-4" />
                            Bài viết đã lưu
                          </Link>
                        </DropdownMenuItem>
                      }
                    />

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Đăng nhập</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Đăng ký</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
