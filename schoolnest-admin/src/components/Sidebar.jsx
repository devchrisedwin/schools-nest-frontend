import React from 'react'
import {
  LayoutDashboard, BookOpen, Users, GraduationCap, UserCircle2,
  ClipboardList, CalendarCheck, Wallet, FileQuestion, MessageSquare,
  CalendarDays, CreditCard, Settings, Building2, LogOut, Plug,
  AlertTriangle
} from 'lucide-react'
import { COLORS } from '../theme'
import { Wallet as WalletIcon } from 'lucide-react'

const SCHOOL_ADMIN_NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'academic', label: 'Academic Setup', icon: BookOpen },
  { key: 'staff', label: 'Staff', icon: Users },
  { key: 'students', label: 'Students', icon: GraduationCap },
  { key: 'parents', label: 'Parents', icon: UserCircle2 },
  { key: 'scores', label: 'Scores & Results', icon: ClipboardList },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { key: 'fees', label: 'Fees', icon: Wallet },
  { key: 'assessments', label: 'Assessments & Exams', icon: FileQuestion },
  { key: 'messaging', label: 'Messaging', icon: MessageSquare },
  { key: 'events', label: 'Events', icon: CalendarDays },
  { key: 'billing', label: 'Billing', icon: CreditCard },
  { key: 'profile', label: 'Settings', icon: Plug },
  { key: 'wallet', label: 'Wallet', icon: WalletIcon },
]

const SUPER_ADMIN_NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'schools', label: 'Schools', icon: Building2 },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'announcements', label: 'Announcements', icon: MessageSquare },
  { key: 'errors', label: 'Error Logs', icon: AlertTriangle },
]

export default function Sidebar({ role, activeSection, onNavigate, onLogout, schoolName }) {
  const nav = role === 'super_admin' ? SUPER_ADMIN_NAV : SCHOOL_ADMIN_NAV

  return (
    <aside className="w-64 flex flex-col h-screen sticky top-0" style={{ backgroundColor: COLORS.navyDeep }}>
      <div className="px-5 py-6" style={{ borderBottom: `1px solid ${COLORS.navyLine}` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded flex items-center justify-center font-semibold text-sm"
            style={{ backgroundColor: COLORS.navyAccent, color: '#fff', fontFamily: "'IBM Plex Mono', monospace" }}>
            SN
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Schoolnest</div>
            <div className="text-xs" style={{ color: COLORS.textOnNavyMuted }}>
              {role === 'super_admin' ? 'Platform Admin' : (schoolName || 'School Admin')}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {nav.map((item) => {
          const Icon = item.icon
          const active = activeSection === item.key
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm mb-0.5 transition-colors duration-150"
              style={{
                backgroundColor: active ? COLORS.navyAccent : 'transparent',
                color: active ? '#fff' : COLORS.textOnNavy,
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = COLORS.navyMid }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <Icon size={17} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="p-3" style={{ borderTop: `1px solid ${COLORS.navyLine}` }}>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors duration-150"
          style={{ color: COLORS.textOnNavy }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.navyMid)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <LogOut size={17} />
          Log out
        </button>
      </div>
    </aside>
  )
}