"use client"

import type React from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../../../hooks/auth/useAuth"
import { isGuestUser, UserRole } from "../../../types"
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "../../ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { Badge } from "../../ui/badge"
import {
  Home,
  BookOpen,
  Users,
  Heart,
  Settings,
  FileText,
  BarChart3,
  Bell,
  User,
  Database,
  Flag,
  PlusCircle,
  Stethoscope,
  Baby,
} from "lucide-react"

const Sidebar: React.FC = () => {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return null

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  return (
    <ShadcnSidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user && !isGuestUser(user) ? user.avatar_url : "/placeholder.svg?height=40&width=40"} />
            <AvatarFallback>
              {user && !isGuestUser(user) ? `${user.first_name?.charAt(0)}${user.last_name?.charAt(0)}` : "G"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            {user && !isGuestUser(user) && (
            <>
                <span className="font-medium truncate">
                {user.first_name} {user.last_name}
                </span>
                <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                    {user.role === UserRole.DOCTOR && "Bác sĩ"}
                    {user.role === UserRole.PARENT && "Phụ huynh"}
                    {user.role === UserRole.ADMIN && "Quản trị viên"}
                </Badge>
                {user.role === UserRole.DOCTOR && (user as any).verified && (
                    <Badge variant="default" className="text-xs">
                    ✓
                    </Badge>
                )}
                </div>              
            </>
            )}

          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Common menu items */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/")}>
                  <Link to="/">
                    <Home />
                    <span>Trang chủ</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/articles")}>
                  <Link to="/articles">
                    <BookOpen />
                    <span>Bài viết</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Role-specific menu items */}
        {user.role === UserRole.PARENT && (
          <SidebarGroup>
            <SidebarGroupLabel>Phụ huynh</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/parent")}>
                    <Link to="/parent">
                      <BarChart3 />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/parent/saved-articles")}>
                    <Link to="/parent/saved-articles">
                      <Heart />
                      <span>Bài viết đã lưu</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/parent/followed-doctors")}>
                    <Link to="/parent/followed-doctors">
                      <Stethoscope />
                      <span>Bác sĩ đang theo dõi</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/parent/children")}>
                    <Link to="/parent/children">
                      <Baby />
                      <span>Quản lý con em</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user.role === UserRole.DOCTOR && (
          <SidebarGroup>
            <SidebarGroupLabel>Bác sĩ</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/doctor")}>
                    <Link to="/doctor">
                      <BarChart3 />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/doctor/articles")}>
                    <Link to="/doctor/articles">
                      <FileText />
                      <span>Bài viết của tôi</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/doctor/articles/create")}>
                    <Link to="/doctor/articles/create">
                      <PlusCircle />
                      <span>Viết bài mới</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/doctor/followers")}>
                    <Link to="/doctor/followers">
                      <Users />
                      <span>Người theo dõi</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user.role === UserRole.ADMIN && (
          <SidebarGroup>
            <SidebarGroupLabel>Quản trị viên</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin")}>
                    <Link to="/admin">
                      <BarChart3 />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/users")}>
                    <Link to="/admin/users">
                      <Users />
                      <span>Quản lý người dùng</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/content-moderation")}>
                    <Link to="/admin/content-moderation">
                      <Flag />
                      <span>Kiểm duyệt nội dung</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/categories")}>
                    <Link to="/admin/categories">
                      <Database />
                      <span>Danh mục & Thẻ</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator />

        {/* Common settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/profile")}>
                  <Link to="/profile">
                    <User />
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/notifications")}>
                  <Link to="/notifications">
                    <Bell />
                    <span>Thông báo</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/settings")}>
                  <Link to="/settings">
                    <Settings />
                    <span>Cài đặt</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-3 py-2">
          <Badge variant="outline" className="w-full justify-center">
            v1.0.0
          </Badge>
        </div>
      </SidebarFooter>
    </ShadcnSidebar>
  )
}

export default Sidebar
