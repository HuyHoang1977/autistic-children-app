"use client"

import type React from "react"
import { useEffect, useState } from "react"
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
import { Bell, Menu, User, Settings, LogOut, Heart, BookOpen, Users, Sun, Moon, Stethoscope } from "lucide-react"
import { useAuth } from "../../../hooks/auth/useAuth"
import {
  isDoctorUser,
  isParentUser,
  isAdminUser,
  isGuestUser,
  ROLE_ADMIN,
  ROLE_PARENT,
  ROLE_DOCTOR,
} from "../../../types/user.types"
import { useTheme } from "../../theme-provider"

const Header: React.FC = () => {
  const { user, logout, isAuthenticated, userVersion } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  
  // State để force re-render avatar
  const [avatarKey, setAvatarKey] = useState(0)
  const [avatarError, setAvatarError] = useState(false)

  // Debug: Track user changes in header
  useEffect(() => {
    console.log('🔍 Header: User changed', {
      user: user ? {
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role_id: user.role_id
      } : null,
      isAuthenticated,
      userVersion
    })
  }, [user, isAuthenticated, userVersion])

  // Force re-render avatar khi user hoặc avatar_url thay đổi
  useEffect(() => {
    console.log('🔄 Header: Avatar changed, forcing re-render', {
      avatar_url: user?.avatar_url,
      userVersion,
      timestamp: new Date().toISOString()
    })
    setAvatarKey(prev => prev + 1)
    setAvatarError(false) // Reset error state
  }, [user?.avatar_url, userVersion])

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Mobile Layout - 2 layers */}
        <div className="block sm:hidden">
          {/* Layer 1: Heart icon, Theme toggle, Auth buttons/Avatar */}
          <div className="flex h-12 items-center justify-between px-1">
            {/* Heart icon */}
            <Link to="/" className="group">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg transition-all group-hover:bg-blue-700 group-hover:scale-105">
                <Heart className="h-6 w-6 text-white" />
              </div>
            </Link>

            {/* Right side: Theme toggle + Auth */}
            <div className="flex items-center space-x-2">
              {/* Theme toggle */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-10 w-10 transition-colors hover:bg-accent"
                title={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
              >
                {theme === "dark" ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
              </Button>

              {isAuthenticated ? (
                /* User Avatar */
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10" key={`avatar-${avatarKey}-${userVersion}`}>
                        <AvatarImage
                          src={user && !isGuestUser(user) && user.avatar_url && !avatarError
                            ? `${user.avatar_url}?v=${avatarKey}&t=${Date.now()}` 
                            : "/placeholder.svg?height=40&width=40"
                          }
                          onError={() => {
                            console.log('❌ Avatar failed to load:', user?.avatar_url)
                            setAvatarError(true)
                            setTimeout(() => {
                              setAvatarError(false)
                              setAvatarKey(prev => prev + 1)
                            }, 2000)
                          }}
                          onLoad={() => {
                            console.log('✅ Avatar loaded successfully:', user?.avatar_url)
                            setAvatarError(false)
                          }}
                        />
                        <AvatarFallback className="text-sm">
                          {user && !isGuestUser(user)
                            ? user.full_name
                              ? user.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                              : "U"
                            : "G"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        {user && !isGuestUser(user) && (
                          <>
                            <p className="text-sm font-medium leading-none">{user.username}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.full_name}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {user.role_id === ROLE_DOCTOR && "Doctor"}
                                {user.role_id === ROLE_PARENT && "Parent"}
                                {user.role_id === ROLE_ADMIN && "Admin"}
                              </Badge>
                              {isDoctorUser(user) && user.doctor_info?.verified && (
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
                      <Link to={`/personal/${user?.user_id}`} className="flex items-center">
                        <Settings className="mr-2 h-5 w-5" />
                        Hồ sơ cá nhân
                      </Link>
                    </DropdownMenuItem>
                    {user && isDoctorUser(user) && (
                      <DropdownMenuItem asChild>
                        <Link to="/doctor/articles" className="flex items-center">
                          <BookOpen className="mr-2 h-5 w-5" />
                          Bài viết của tôi
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user && isParentUser(user) && (
                      <DropdownMenuItem asChild>
                        <Link to="/parent/saved-articles" className="flex items-center">
                          <Heart className="mr-2 h-5 w-5" />
                          Bài viết đã lưu
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user && (isParentUser(user) || isDoctorUser(user) || isAdminUser(user)) && (
                      <DropdownMenuItem asChild>
                        <Link to="/notifications" className="flex items-center">
                          <Bell className="mr-2 h-5 w-5" />
                          Thông báo
                          <Badge variant="destructive" className="ml-auto text-xs">
                            3
                          </Badge>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-5 w-5" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                /* Auth buttons */
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" asChild size="sm" className="h-9 px-3 text-sm">
                    <Link to="/login">Đăng nhập</Link>
                  </Button>
                  <Button asChild size="sm" className="h-9 px-3 text-sm">
                    <Link to="/register">Đăng ký</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Layer 2: HeartCare text and Navigation dropdown */}
          <div className="flex h-11 items-center justify-between px-1 border-t border-border/40">
            {/* HeartCare text */}
            <Link to="/" className="group">
              <span className="font-bold text-xl transition-colors group-hover:text-blue-600">HeartCare</span>
            </Link>

            {/* Navigation dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 w-10 transition-colors hover:bg-accent">
                  <Menu className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/articles" className="flex items-center">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Bài viết
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/doctors" className="flex items-center">
                    <Stethoscope className="mr-2 h-5 w-5" />
                    Bác sĩ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/about" className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Giới thiệu
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/contact" className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Liên hệ
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Desktop Layout - Original single row */}
        <div className="hidden sm:flex h-14 sm:h-16 items-center justify-between">
          {/* Logo and Sidebar Trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-lg transition-all group-hover:bg-blue-700 group-hover:scale-105">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="font-bold text-base sm:text-xl transition-colors group-hover:text-blue-600">Healthcare</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link
              to="/"
              className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2">
              Trang Chủ
            </Link>

            <Link
              to="/articles"
              className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2">
              Bài viết
            </Link>

            <Link
              to="/doctors" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2">
              Bác sĩ
            </Link>

            <Link to="/about" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2">
              Giới thiệu
            </Link>

            <Link to="/contact" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2">
              Liên hệ
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme toggle - Consistent size with tooltip */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-10 w-10 transition-colors hover:bg-accent"
              title={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {isAuthenticated ? (
              <>
                {/* Notifications - Hidden on very small screens */}
                {user && (isParentUser(user) || isDoctorUser(user) || isAdminUser(user)) && (
                  <Link to="/notifications" className="hidden sm:block">
                    <Button variant="ghost" size="sm" className="relative h-10 w-10">
                      <Bell className="h-5 w-5" />
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
                      >
                        3
                      </Badge>
                    </Button>
                  </Link>
                )}

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10" key={`avatar-${avatarKey}-${userVersion}`}>
                        <AvatarImage
                          src={user && !isGuestUser(user) && user.avatar_url && !avatarError
                            ? `${user.avatar_url}?v=${avatarKey}&t=${Date.now()}` 
                            : "/placeholder.svg?height=32&width=32"
                          }
                          onError={() => {
                            console.log('❌ Avatar failed to load:', user?.avatar_url)
                            setAvatarError(true)
                            // Retry after a short delay
                            setTimeout(() => {
                              setAvatarError(false)
                              setAvatarKey(prev => prev + 1)
                            }, 2000)
                          }}
                          onLoad={() => {
                            console.log('✅ Avatar loaded successfully:', user?.avatar_url)
                            setAvatarError(false)
                          }}
                        />
                        <AvatarFallback className="text-sm">
                          {user && !isGuestUser(user)
                            ? user.full_name
                              ? user.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                              : "U"
                            : "G"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        {user && !isGuestUser(user) && (
                          <>
                            <p className="text-sm font-medium leading-none">{user.username}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.full_name}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {user.role_id === ROLE_DOCTOR && "Doctor"}
                                {user.role_id === ROLE_PARENT && "Parent"}
                                {user.role_id === ROLE_ADMIN && "Admin"}
                              </Badge>
                              {isDoctorUser(user) && user.doctor_info?.verified && (
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

                    {/* Mobile-only navigation items */}
                    <div className="lg:hidden">
                      <DropdownMenuItem asChild>
                        <Link to="/articles" className="flex items-center">
                          <BookOpen className="mr-2 h-5 w-5" />
                          Bài viết
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/doctors" className="flex items-center">
                          <Stethoscope className="mr-2 h-5 w-5" />
                          Bác sĩ
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/about" className="flex items-center">
                          <User className="mr-2 h-5 w-5" />
                          Giới thiệu
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/contact" className="flex items-center">
                          <Users className="mr-2 h-5 w-5" />
                          Liên hệ
                        </Link>
                      </DropdownMenuItem>
                      
                      {/* Mobile notifications */}
                      {user && (isParentUser(user) || isDoctorUser(user) || isAdminUser(user)) && (
                        <DropdownMenuItem asChild>
                          <Link to="/notifications" className="flex items-center sm:hidden">
                            <Bell className="mr-2 h-5 w-5" />
                            Thông báo
                            <Badge variant="destructive" className="ml-auto text-xs">
                              3
                            </Badge>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                    </div>

                    <DropdownMenuItem asChild>
                      <Link to={`/personal/${user?.user_id}`} className="flex items-center">
                        <Settings className="mr-2 h-5 w-5" />
                        Hồ sơ cá nhân
                      </Link>
                    </DropdownMenuItem>

                    {user && isDoctorUser(user) && (
                      <DropdownMenuItem asChild>
                        <Link to="/doctor/articles" className="flex items-center">
                          <BookOpen className="mr-2 h-5 w-5" />
                          Bài viết của tôi
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user && isParentUser(user) && (
                      <DropdownMenuItem asChild>
                        <Link to="/parent/saved-articles" className="flex items-center">
                          <Heart className="mr-2 h-5 w-5" />
                          Bài viết đã lưu
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-5 w-5" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Mobile menu for unauthenticated users */}
                <div className="lg:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-10 w-10">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link to="/articles" className="flex items-center">
                          <BookOpen className="mr-2 h-5 w-5" />
                          Bài viết
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/doctors" className="flex items-center">
                          <Stethoscope className="mr-2 h-5 w-5" />
                          Bác sĩ
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/about" className="flex items-center">
                          <User className="mr-2 h-5 w-5" />
                          Giới thiệu
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/contact" className="flex items-center">
                          <Users className="mr-2 h-5 w-5" />
                          Liên hệ
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Auth buttons */}
                <Button variant="ghost" asChild size="sm" className="h-8 px-2 sm:px-3 text-sm">
                  <Link to="/login">Đăng nhập</Link>
                </Button>
                <Button asChild size="sm" className="h-8 px-2 sm:px-3 text-sm">
                  <Link to="/register">Đăng ký</Link>
                </Button>
              </div>
            )}

            {/* Remove the old mobile menu button */}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header