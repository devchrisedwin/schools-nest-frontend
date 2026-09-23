// ============================================================
// [SCHOOL ADMIN PORTAL / SUPER ADMIN PORTAL] — Dashboard (UPDATED)
// School Admin dashboard now has real content after onboarding
// completes: quick actions, upcoming events, low-attendance alert,
// fee snapshot, and a recent-messages preview — not just 3 cards
// and empty space.
// ============================================================
import React, { useState, useEffect } from 'react'
import {
  Users, GraduationCap, CreditCard, CheckCircle2, Circle, Building2, TrendingUp,
  BookOpen, CalendarDays, TrendingDown, Mail, ArrowRight, Wallet, MessageSquare, ScanLine,
} from 'lucide-react'
import { COLORS, formatNaira, formatDate } from '../theme'
import { apiFetch } from '../api'
import { StatCard, Spinner, ErrorBanner, Badge } from '../components/ui'

export default function DashboardHome({ baseUrl, token, subdomain, role, schoolId, onNavigate }) {
  if (role === 'super_admin') return <SuperAdminDashboard baseUrl={baseUrl} token={token} />
  return <SchoolAdminDashboard baseUrl={baseUrl} token={token} subdomain={subdomain} schoolId={schoolId} onNavigate={onNavigate} />
}

const QUICK_ACTIONS = [
  { key: 'students', label: 'Enroll a student', icon: GraduationCap },
  { key: 'staff', label: 'Add staff', icon: Users },
  { key: 'events', label: 'Create an event', icon: CalendarDays },
  { key: 'messaging', label: 'Send a message', icon: MessageSquare },
]

function SchoolAdminDashboard({ baseUrl, token, subdomain, schoolId, onNavigate }) {
  const opts = { token, subdomain }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [onboarding, setOnboarding] = useState(null)
  const [studentCount, setStudentCount] = useState(null)
  const [staffCount, setStaffCount] = useState(null)
  const [classCount, setClassCount] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [events, setEvents] = useState([])
  const [lowAttendance, setLowAttendance] = useState([])
  const [feeDashboard, setFeeDashboard] = useState(null)
  const [inbox, setInbox] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError('')
      try {
        const [onboardingRes, studentsRes, staffRes, classesRes, subRes, termRes, eventsRes, inboxRes] = await Promise.allSettled([
          apiFetch(baseUrl, `/schools/${schoolId}/onboarding-status`, opts),
          apiFetch(baseUrl, '/students', opts),
          apiFetch(baseUrl, '/staff', opts),
          apiFetch(baseUrl, '/classes', opts),
          apiFetch(baseUrl, '/billing/subscription', opts),
          apiFetch(baseUrl, '/terms/active', opts),
          apiFetch(baseUrl, '/events', opts),
          apiFetch(baseUrl, '/messages/inbox', opts),
        ])
        if (cancelled) return
        if (onboardingRes.status === 'fulfilled') setOnboarding(onboardingRes.value)
        if (studentsRes.status === 'fulfilled') setStudentCount(studentsRes.value.length)
        if (staffRes.status === 'fulfilled') setStaffCount(staffRes.value.length)
        if (classesRes.status === 'fulfilled') setClassCount(classesRes.value.length)
        if (subRes.status === 'fulfilled') setSubscription(subRes.value)
        if (inboxRes.status === 'fulfilled') setInbox(inboxRes.value)

        if (eventsRes.status === 'fulfilled') {
          const upcoming = eventsRes.value.filter((e) => new Date(e.eventDate) >= new Date()).slice(0, 4)
          setEvents(upcoming)
        }

        if (termRes.status === 'fulfilled' && termRes.value) {
          const termId = termRes.value.id
          const [lowRes, feeRes] = await Promise.allSettled([
            apiFetch(baseUrl, `/attendance/low?termId=${termId}&threshold=75`, opts),
            apiFetch(baseUrl, `/fees/dashboard?termId=${termId}`, opts),
          ])
          if (!cancelled) {
            if (lowRes.status === 'fulfilled') setLowAttendance(lowRes.value)
            if (feeRes.status === 'fulfilled') setFeeDashboard(feeRes.value)
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [baseUrl, token, subdomain, schoolId])

  if (loading) return <Spinner label="Loading dashboard…" />

  const subLapsed = subscription?.status === 'lapsed' || subscription?.status === 'suspended'
  const unreadCount = inbox?.received?.filter((m) => !m.readAt).length ?? 0

  return (
    <div>
      <ErrorBanner message={error} />

      {subLapsed && (
        <div className="rounded px-4 py-3 mb-6 flex items-center justify-between" style={{ backgroundColor: '#FBEAEA', border: '1px solid #F0C7C5' }}>
          <span className="text-sm font-medium" style={{ color: COLORS.red }}>
            Subscription {subscription.status} — visit Billing to restore full access.
          </span>
          <button onClick={() => onNavigate('billing')} className="text-xs font-semibold" style={{ color: COLORS.red }}>Go to Billing →</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Students" value={studentCount ?? '—'} icon={GraduationCap} accent="navy" />
        <StatCard label="Staff" value={staffCount ?? '—'} icon={Users} accent="navy" />
        <StatCard label="Classes" value={classCount ?? '—'} icon={BookOpen} accent="navy" />
        <StatCard
          label="Subscription"
          value={subscription ? formatNaira(subscription.estimatedNextInvoiceAmount) : '—'}
          sub={subscription ? `${subscription.billingCycle} · next invoice estimate` : ''}
          icon={CreditCard}
          accent={subLapsed ? 'red' : 'green'}
        />
      </div>

      {onboarding && !onboarding.isFullySetUp && (
        <div className="bg-white rounded p-5 mb-6" style={{ border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>Finish setting up your school</h3>
            <span className="text-xs font-medium" style={{ color: COLORS.textSecondary, fontFamily: "'IBM Plex Mono', monospace" }}>
              {onboarding.completedCount}/{onboarding.totalSteps}
            </span>
          </div>
          <div className="h-1.5 rounded-full mb-5 overflow-hidden" style={{ backgroundColor: COLORS.surface }}>
            <div className="h-full rounded-full" style={{ width: `${onboarding.percentageComplete}%`, backgroundColor: COLORS.navyAccent }} />
          </div>
          <div className="space-y-2.5">
            {onboarding.steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                {s.completed ? <CheckCircle2 size={16} style={{ color: COLORS.green }} /> : <Circle size={16} style={{ color: COLORS.border }} />}
                <span style={{ color: s.completed ? COLORS.textSecondary : COLORS.textPrimary, textDecoration: s.completed ? 'line-through' : 'none' }}>{s.step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Quick actions */}
        <div className="bg-white rounded p-5" style={{ border: `1px solid ${COLORS.border}` }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: COLORS.textPrimary }}>Quick actions</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon
              return (
                <button key={a.key} onClick={() => onNavigate(a.key)}
                  className="flex flex-col items-start gap-2 p-3 rounded text-left transition-colors hover:bg-gray-50"
                  style={{ border: `1px solid ${COLORS.border}` }}>
                  <Icon size={16} style={{ color: COLORS.navyAccent }} />
                  <span className="text-xs font-medium" style={{ color: COLORS.textPrimary }}>{a.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="bg-white rounded p-5" style={{ border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>Upcoming events</h3>
            <button onClick={() => onNavigate('events')}><ArrowRight size={14} style={{ color: COLORS.textSecondary }} /></button>
          </div>
          {events.length === 0 && <p className="text-xs" style={{ color: COLORS.textSecondary }}>No upcoming events.</p>}
          <div className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="flex items-start gap-2.5">
                <div className="w-1 self-stretch rounded" style={{ backgroundColor: COLORS.navyAccent }} />
                <div>
                  <div className="text-xs font-medium" style={{ color: COLORS.textPrimary }}>{e.title}</div>
                  <div className="text-xs" style={{ color: COLORS.textSecondary }}>{formatDate(e.eventDate)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fee snapshot */}
        <div className="bg-white rounded p-5" style={{ border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>Fee collection</h3>
            <button onClick={() => onNavigate('fees')}><ArrowRight size={14} style={{ color: COLORS.textSecondary }} /></button>
          </div>
          {!feeDashboard && <p className="text-xs" style={{ color: COLORS.textSecondary }}>No active term.</p>}
          {feeDashboard && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={14} style={{ color: COLORS.green }} />
                <span className="text-lg font-semibold" style={{ color: COLORS.textPrimary, fontFamily: "'IBM Plex Mono', monospace" }}>{formatNaira(feeDashboard.totalCollected)}</span>
              </div>
              <div className="text-xs mb-3" style={{ color: COLORS.textSecondary }}>collected of {formatNaira(feeDashboard.totalExpected)} expected</div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.surface }}>
                <div className="h-full rounded-full" style={{ backgroundColor: COLORS.green, width: `${feeDashboard.totalExpected > 0 ? Math.min((feeDashboard.totalCollected / feeDashboard.totalExpected) * 100, 100) : 0}%` }} />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Low attendance alert */}
        <div className="bg-white rounded p-5" style={{ border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>Attendance alerts</h3>
            <button onClick={() => onNavigate('attendance')}><ArrowRight size={14} style={{ color: COLORS.textSecondary }} /></button>
          </div>
          {lowAttendance.length === 0 && (
            <p className="text-xs" style={{ color: COLORS.textSecondary }}>No students below 75% attendance this term.</p>
          )}
          {lowAttendance.slice(0, 4).map((s) => (
            <div key={s.studentId} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <span className="text-xs font-medium" style={{ color: COLORS.textPrimary }}>{s.studentName}</span>
              <span className="text-xs flex items-center gap-1" style={{ color: COLORS.red }}>
                <TrendingDown size={11} />{s.attendancePercentage}%
              </span>
            </div>
          ))}
        </div>

        {/* Recent messages */}
        <div className="bg-white rounded p-5" style={{ border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.textPrimary }}>
              Recent messages {unreadCount > 0 && <Badge tone="red">{unreadCount} unread</Badge>}
            </h3>
            <button onClick={() => onNavigate('messaging')}><ArrowRight size={14} style={{ color: COLORS.textSecondary }} /></button>
          </div>
          {(!inbox?.received || inbox.received.length === 0) && <p className="text-xs" style={{ color: COLORS.textSecondary }}>No messages yet.</p>}
          {inbox?.received?.slice(0, 4).map((m) => (
            <div key={m.id} className="flex items-start gap-2.5 py-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <Mail size={13} style={{ color: m.readAt ? COLORS.textSecondary : COLORS.navyAccent, marginTop: 2 }} />
              <div>
                <div className="text-xs font-medium" style={{ color: COLORS.textPrimary }}>{m.sender?.fullName || 'A parent'}</div>
                <div className="text-xs truncate" style={{ color: COLORS.textSecondary, maxWidth: 220 }}>{m.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SuperAdminDashboard({ baseUrl, token }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [recentSchools, setRecentSchools] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError('')
      try {
        const [statsRes, schoolsRes] = await Promise.allSettled([
          apiFetch(baseUrl, '/super-admin/dashboard', { token }),
          apiFetch(baseUrl, '/super-admin/schools?limit=5', { token }),
        ])
        if (cancelled) return
        if (statsRes.status === 'fulfilled') setStats(statsRes.value)
        if (schoolsRes.status === 'fulfilled') setRecentSchools(schoolsRes.value.schools || [])
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [baseUrl, token])

  if (loading) return <Spinner label="Loading platform stats…" />

  return (
    <div>
      <ErrorBanner message={error} />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Schools" value={stats?.totalSchools ?? '—'} icon={Building2} accent="navy" />
        <StatCard label="Active Subs" value={stats?.activeSubscriptions ?? '—'} icon={CheckCircle2} accent="green" />
        <StatCard label="Trial" value={stats?.trialSchools ?? '—'} icon={TrendingUp} accent="amber" />
        <StatCard label="Monthly Revenue" value={formatNaira(stats?.monthlyRevenue)} icon={CreditCard} accent="green" />
      </div>
      <div className="bg-white rounded" style={{ border: `1px solid ${COLORS.border}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <h3 className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>Recently registered schools</h3>
        </div>
        {recentSchools.length === 0 && <div className="px-5 py-6 text-sm text-center" style={{ color: COLORS.textSecondary }}>No schools yet.</div>}
        {recentSchools.map((s) => (
          <div key={s.id} className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <div>
              <div className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>{s.name}</div>
              <div className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: "'IBM Plex Mono', monospace" }}>{s.subdomain}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: COLORS.textSecondary }}>{formatDate(s.createdAt)}</span>
              <Badge tone={s.isSuspended ? 'red' : 'green'}>{s.isSuspended ? 'Suspended' : 'Active'}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}