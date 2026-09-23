// ============================================================
// [SHARED — School Admin, and reusable for other roles later]
// Notification center — full list, unread tracking, mark-all-read.
// ============================================================
import React, { useState, useEffect } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { COLORS, formatDate } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Spinner, ErrorBanner, EmptyState } from '../../components/ui'
import InfiniteScrollSentinel from '../../components/InfiniteScrollSentinel'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'

export default function NotificationsPage({ baseUrl, token, subdomain, onUnreadCountChange }) {
  const opts = { token, subdomain }
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll(notifications, 20)

  async function load() {
    setLoading(true); setError('')
    try {
      const data = await apiFetch(baseUrl, '/notifications', opts)
      setNotifications(data.notifications)
      onUnreadCountChange?.(data.unreadCount)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [baseUrl, token, subdomain])

  async function markAllRead() {
    try {
      await apiFetch(baseUrl, '/notifications/read-all', { ...opts, method: 'PATCH' })
      await load()
    } catch (err) { setError(err.message) }
  }

  if (loading) return <Spinner label="Loading notifications…" />

  return (
    <div>
      <ErrorBanner message={error} />
      <div className="flex justify-end mb-4">
        <Button size="sm" variant="ghost" onClick={markAllRead}><CheckCheck size={14} /> Mark all read</Button>
      </div>

      {notifications.length === 0 && <EmptyState icon={Bell} title="No notifications yet" />}

      <div className="bg-white rounded overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
        {visibleItems.map((n, i) => (
          <div key={n.id} className="px-4 py-3.5 flex items-start gap-3"
            style={{ borderBottom: i < visibleItems.length - 1 ? `1px solid ${COLORS.border}` : 'none', backgroundColor: n.readAt ? '#fff' : '#F0F5FF' }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: n.readAt ? 'transparent' : COLORS.navyAccent }} />
            <div className="flex-1">
              <div className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>{n.title}</div>
              <div className="text-xs mt-0.5" style={{ color: COLORS.textSecondary }}>{n.body}</div>
              <div className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>{formatDate(n.sentAt)}</div>
            </div>
          </div>
        ))}
      </div>
      <InfiniteScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
    </div>
  )
}