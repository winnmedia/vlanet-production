/**
 * NotificationBell Widget
 * 실시간 알림 벨 위젯
 */

'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Eye, MessageSquare } from 'lucide-react'
import { Button } from '../../shared/ui/button'
import { Card } from '../../shared/ui/card'
// import { getNotificationsByUser } from '../../entities/proposal/api' // TODO: 클라이언트 컴포넌트에서 서버 API 직접 호출 불가
import {
  getNotificationTypeText,
  getNotificationIcon,
  formatProposalTime
} from '../../entities/proposal'
import { markNotificationAsReadAction } from '../../features/contact'
import type { Notification } from '../../entities/proposal'
import type { ProfileRow } from '../../entities/user'

interface NotificationBellProps {
  user: ProfileRow
  className?: string
}

export function NotificationBell({
  user,
  className
}: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 알림 로드
  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      // TODO: 클라이언트 컴포넌트에서 서버 API 직접 호출 불가 - 임시 mock 데이터 사용
      const result = {
        notifications: [],
        unread_count: 0
      }

      setNotifications(result.notifications)
      setUnreadCount(result.unread_count)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 컴포넌트 마운트 시 알림 로드
  useEffect(() => {
    loadNotifications()
  }, [user.id])

  // 실시간 업데이트 (5분마다)
  useEffect(() => {
    const interval = setInterval(loadNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user.id])

  // 알림 읽음 처리
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsReadAction(notificationId)
      if (result.success) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // 모든 알림 읽음 처리
  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read)

    await Promise.all(
      unreadNotifications.map(n => handleMarkAsRead(n.id))
    )
  }

  // 알림 클릭 핸들러
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id)
    }

    // 관련 페이지로 이동
    if (notification.proposal_id) {
      window.location.href = `/dashboard/proposals`
    }

    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      {/* 알림 벨 버튼 */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="sm"
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* 알림 패널 */}
      {isOpen && (
        <>
          {/* 오버레이 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 알림 드롭다운 */}
          <Card className="absolute right-0 top-full mt-2 w-96 max-h-96 overflow-hidden z-50 shadow-lg">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">
                알림 {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    onClick={handleMarkAllAsRead}
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                  >
                    모두 읽음
                  </Button>
                )}
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* 알림 목록 */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">로딩 중...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">새로운 알림이 없습니다</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.is_read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* 알림 아이콘 */}
                        <div className="flex-shrink-0">
                          <span className="text-lg">
                            {getNotificationIcon(notification.type)}
                          </span>
                        </div>

                        {/* 알림 내용 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-blue-600">
                              {getNotificationTypeText(notification.type)}
                            </span>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>

                          <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                            {notification.title}
                          </h4>

                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {notification.content}
                          </p>

                          <p className="text-xs text-gray-400">
                            {formatProposalTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 푸터 */}
            {notifications.length > 0 && (
              <div className="border-t p-3 text-center">
                <Button
                  onClick={() => {
                    window.location.href = '/dashboard/proposals'
                    setIsOpen(false)
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  모든 알림 보기
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}