import React from 'react'
import { Bell } from 'lucide-react'
import { COLORS } from '../theme'

const SECTION_TITLES = {
  dashboard: 'Dashboard', academic: 'Academic Setup', staff: 'Staff Management',
  students: 'Student Management', parents: 'Parent Management', scores: 'Scores & Results',
  attendance: 'Attendance', fees: 'Fee Management', assessments: 'Assessments & Exams',
  messaging: 'Messaging', events: 'Events', billing: 'Billing', wallet: 'Wallet',
  profile: 'School Profile', notifications: 'Notifications',
  schools: 'Schools', payments: 'Payments', announcements: 'Announcements', errors: 'Error Logs',
}

export default function Topbar({ activeSection, userName, avatarUrl, unreadCount, onOpenNotifications }) {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white sticky top-0 z-10"
      style={{ borderBottom: `1px solid ${COLORS.border}` }}>
      <h1 className="text-lg font-semibold" style={{ color: COLORS.textPrimary }}>
        {SECTION_TITLES[activeSection] || 'Dashboard'}
      </h1>
      <div className="flex items-center gap-4">
        <button onClick={onOpenNotifications} className="relative p-2 rounded hover:bg-gray-100" style={{ color: COLORS.textSecondary }}>
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
              style={{ backgroundColor: COLORS.red }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold overflow-hidden"
            style={{ backgroundColor: COLORS.navyMid, color: '#fff' }}>
            {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : (userName || 'A').slice(0, 1).toUpperCase()}
          </div>
          <span className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>{userName}</span>
        </div>
      </div>
    </header>
  )
}