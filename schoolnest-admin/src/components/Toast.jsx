import React, { useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { COLORS } from '../theme'

export default function Toast({ notification, onClose, onClick }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000)
    return () => clearTimeout(t)
  }, [notification])

  if (!notification) return null

  return (
    <div
      onClick={onClick}
      className="fixed top-5 right-5 z-50 w-80 bg-white rounded-lg p-4 cursor-pointer"
      style={{ border: `1px solid ${COLORS.border}`, boxShadow: '0 8px 24px rgba(11,21,38,0.15)' }}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: COLORS.navyAccent }}>
          <Bell size={14} style={{ color: '#fff' }} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>{notification.title}</div>
          <div className="text-xs mt-0.5" style={{ color: COLORS.textSecondary }}>{notification.body}</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose() }}>
          <X size={14} style={{ color: COLORS.textSecondary }} />
        </button>
      </div>
    </div>
  )
}