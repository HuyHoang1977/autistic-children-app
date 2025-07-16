"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardFooter } from "../../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Star, MapPin, Users, CheckCircle2, Heart, MessageCircle, Calendar, Lock } from "lucide-react"
import type { Doctor } from "../../types/doctors.types"
import { formatNumber } from "../../utils/helper"
import { followService } from "../../api/services/follow.service"
import { useAuth } from "../../hooks/auth/useAuth"
import { ROLE_PARENT } from "../../types/user.types"

interface DoctorCardProps {
  doctor: Doctor
  onViewDetails?: (doctorId: number) => void
  onFollow?: (doctorId: number) => void
  showFollowButton?: boolean
  compact?: boolean
  isFollowing?: boolean
}

const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onViewDetails,
  onFollow,
  showFollowButton = true,
  compact = false,
  isFollowing = false,
}) => {
  const [following, setFollowing] = useState(isFollowing)
  const [followersCount, setFollowersCount] = useState(doctor.followers_count)
  const [isLoading, setIsLoading] = useState(false)
  const [followStatusLoading, setFollowStatusLoading] = useState(false)
  
  const { user, isAuthenticated, hasRole } = useAuth()
  const navigate = useNavigate()

  // Check follow status when component mounts (only if authenticated and is parent)
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!isAuthenticated || !user || !hasRole(ROLE_PARENT)) return
      
      setFollowStatusLoading(true)
      try {
        const response = await followService.checkFollowStatus(doctor.doctor_id)
        if (response.success) {
          setFollowing(response.is_following)
        }
      } catch (error) {
        console.error("Error checking follow status:", error)
      } finally {
        setFollowStatusLoading(false)
      }
    }

    checkFollowStatus()
  }, [doctor.doctor_id, isAuthenticated, user, hasRole])

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Don't do anything if not authenticated
    if (!isAuthenticated) {
      return
    }

    // Check if user is a parent
    if (!hasRole(ROLE_PARENT)) {
      alert('Chỉ phụ huynh mới có thể theo dõi bác sĩ')
      return
    }

    if (isLoading) return
    
    setIsLoading(true)
    
    try {
      const response = await followService.toggleFollowDoctor(doctor.doctor_id)
      
      if (response.success) {
        setFollowing(response.is_following || false)
        setFollowersCount(response.followers_count || followersCount)
        
        // Call parent callback if provided
        if (onFollow) {
          await onFollow(doctor.doctor_id)
        }
      } else {
        console.error("Error following/unfollowing doctor:", response.message)
        alert(response.message || 'Có lỗi xảy ra khi thực hiện thao tác')
      }
    } catch (error) {
      console.error("Error following/unfollowing doctor:", error)
      alert('Có lỗi xảy ra khi thực hiện thao tác')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMessage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Don't do anything if not authenticated
    if (!isAuthenticated) {
      return
    }

    // Navigate to messaging page or open chat
    navigate(`/messages/doctor/${doctor.doctor_id}`)
  }

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(doctor.doctor_id)
    }
  }

  const renderRating = () => {
    if (!doctor.rating) return null

    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{doctor.rating.toFixed(1)}</span>
        <span className="text-gray-500 text-sm">({formatNumber(doctor.total_reviews || 0)})</span>
      </div>
    )
  }

  const renderFollowButton = () => {
    if (!showFollowButton) return null

    // Show loading state if checking follow status
    if (followStatusLoading) {
      return (
        <Button variant="outline" size="sm" className="flex-1" disabled>
          <Heart className="h-4 w-4 mr-2" />
          Đang tải...
        </Button>
      )
    }

    // If not authenticated, show disabled button with tooltip
    if (!isAuthenticated) {
      return (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleFollow} 
          className="flex-1 cursor-not-allowed opacity-60"
          disabled
          title="Vui lòng đăng nhập để theo dõi bác sĩ"
        >
          <Lock className="h-4 w-4 mr-2" />
          Theo dõi
        </Button>
      )
    }

    // If authenticated but not a parent, show disabled button
    if (!hasRole(ROLE_PARENT)) {
      return (
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 cursor-not-allowed opacity-60"
          disabled
          title="Chỉ phụ huynh mới có thể theo dõi bác sĩ"
        >
          <Heart className="h-4 w-4 mr-2" />
          Theo dõi
        </Button>
      )
    }

    // If authenticated and is parent, show functional follow button
    return (
      <Button 
        variant={following ? "secondary" : "default"} 
        size="sm" 
        onClick={handleFollow} 
        className="flex-1"
        disabled={isLoading}
      >
        <Heart className={`h-4 w-4 mr-2 ${following ? "fill-current" : ""}`} />
        {isLoading ? "Đang xử lý..." : (following ? "Đang theo dõi" : "Theo dõi")}
      </Button>
    )
  }

  const renderMessageButton = () => {
    // If not authenticated, show disabled button with tooltip
    if (!isAuthenticated) {
      return (
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 bg-transparent cursor-not-allowed opacity-60"
          onClick={handleMessage}
          disabled
          title="Vui lòng đăng nhập để nhắn tin với bác sĩ"
        >
          <Lock className="h-4 w-4 mr-2" />
          Nhắn tin
        </Button>
      )
    }

    // If authenticated, show functional message button
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="flex-1 bg-transparent"
        onClick={handleMessage}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Nhắn tin
      </Button>
    )
  }

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${compact ? "h-auto" : "h-full"}`}>
      <Link to={`/personal/${doctor.user_id}`} onClick={handleViewDetails}>
        <CardContent className={`${compact ? "p-4" : "p-6"}`}>
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <Avatar className={`${compact ? "h-12 w-12" : "h-16 w-16"}`}>
              <AvatarImage src={doctor.avatar_url || "/placeholder.svg?height=64&width=64"} />
              <AvatarFallback className="text-lg font-semibold">
                {doctor.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-bold text-gray-900 truncate ${compact ? "text-base" : "text-lg"}`}>
                  BS. {doctor.full_name}
                </h3>
                {doctor.verified && <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />}
              </div>

              {/* Specialty */}
              <div className="flex flex-wrap gap-1 mb-2">
                {doctor.primary_specialty && (
                  <Badge variant="secondary" className="text-xs">
                    {doctor.primary_specialty}
                  </Badge>
                )}
                {doctor.specializations?.slice(0, 2).map((spec, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {spec.specialization}
                  </Badge>
                ))}
                {doctor.specializations && doctor.specializations.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{doctor.specializations.length - 2}
                  </Badge>
                )}
              </div>

              {/* Rating */}
              {!compact && renderRating()}
            </div>
          </div>

          {/* Clinic Info */}
          {doctor.clinic_name && (
            <div className="mb-3">
              <p className="font-medium text-sm text-gray-900 mb-1">{doctor.clinic_name}</p>
              {doctor.clinic_address && (
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin className="h-3 w-3" />
                  <span className="text-xs truncate">{doctor.clinic_address}</span>
                </div>
              )}
            </div>
          )}

          {/* Bio */}
          {!compact && doctor.bio && <p className="text-sm text-gray-600 line-clamp-2 mb-3">{doctor.bio}</p>}

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              {compact && renderRating()}
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{formatNumber(followersCount)} theo dõi</span>
              </div>
              {doctor.years_experience && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{doctor.years_experience} năm KN</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Link>

      {/* Actions */}
      <CardFooter className={`border-t flex gap-2 ${compact ? "p-3" : "p-4"}`}>
        {renderMessageButton()}
        {renderFollowButton()}
      </CardFooter>

      {/* Login Required Notice - Only show when not authenticated */}
      {/* {!isAuthenticated && (
        <div className="px-4 pb-3">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-600">
              <Lock className="h-3 w-3 inline mr-1" />
              Đăng nhập để sử dụng đầy đủ chức năng
            </p>
          </div>
        </div>
      )} */}
    </Card>
  )
}

export default DoctorCard