import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, Check, Trash2, Settings, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../ui/dropdown-menu';
import { useNotifications } from '../../../hooks/api/useNotification';
import { 
  formatNotificationTime, 
  getNotificationTypeColor, 
  parseNotificationMetadata 
} from '../../../types/notification';
import type { Notification } from '../../../types/notification';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}) => {
  const metadata = parseNotificationMetadata(notification.notification_metadata);
  const typeColor = getNotificationTypeColor(notification.notification_type);
  
  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    if (!notification.is_read) {
      onMarkAsRead(notification.notification_id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Stop event bubbling
    onDelete(notification.notification_id);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Stop event bubbling
    onMarkAsRead(notification.notification_id);
  };

  const getNotificationLink = () => {
    if (metadata?.type === 'new_article' && metadata.article_id) {
      return `/articles/${metadata.article_id}`;
    }
    if (metadata?.type === 'follow' && metadata.follower_id) {
      return `/personal/${metadata.follower_id}`;
    }
    return null;
  };

  const link = getNotificationLink();

  const content = (
    <div 
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-gray-50 ${
        !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      }`}
      onClick={handleClick}
    >
      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
        notification.is_read ? 'bg-gray-300' : 'bg-blue-500'
      }`} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className={`text-sm font-medium ${typeColor} ${
              !notification.is_read ? 'font-semibold' : ''
            }`}>
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {notification.message}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {formatNotificationTime(notification.created_at)}
            </p>
          </div>
          
          <div className="flex items-center gap-1 ml-2">
            {!notification.is_read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAsRead}
                className="h-6 w-6 p-0 hover:bg-blue-100"
                title="Đánh dấu đã đọc"
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
              title="Xóa thông báo"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link 
        to={link} 
        className="block"
        onClick={(e) => {
          // Prevent navigation if clicking on action buttons
          if ((e.target as HTMLElement).closest('button')) {
            e.preventDefault();
          }
        }}
      >
        {content}
      </Link>
    );
  }

  return content;
};

interface NotificationDropdownProps {
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className }) => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications({ limit: 10, offset: 0 });

  const [isOpen, setIsOpen] = useState(false);

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen, refresh]);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleRefresh = async () => {
    await refresh();
  };

  const handleLoadMore = async () => {
    await loadMore();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative h-10 w-10 ${className}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-96 p-0"
        side="bottom"
        sideOffset={5}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <h3 className="font-semibold">Thông báo</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-8 w-8 p-0"
              title="Làm mới"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-8 px-2 text-xs"
                title="Đánh dấu tất cả đã đọc"
              >
                <Check className="h-3 w-3 mr-1" />
                Đọc tất cả
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-red-600 mb-2">Có lỗi xảy ra</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="text-xs"
              >
                Thử lại
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Không có thông báo nào</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.notification_id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
              
              {hasMore && (
                <div className="p-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="text-xs"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Đang tải...
                      </>
                    ) : (
                      'Xem thêm'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <Separator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
