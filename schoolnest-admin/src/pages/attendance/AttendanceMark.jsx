// ============================================================
// [SCHOOL ADMIN PORTAL] — Attendance (UPDATED — view only)
// Admin VIEWS daily records and low-attendance insights. Marking
// is a teacher action, not in this console.
// ============================================================
import React, { useState, useEffect } from 'react'
import { CalendarCheck, TrendingDown, Eye } from 'lucide-react'
import { COLORS } from '../../theme'
import { apiFetch } from '../../api'
import { Badge, Spinner, ErrorBanner, Select, EmptyState } from '../../components/ui'
import InfiniteScrollSentinel from '../../components/InfiniteScrollSentinel'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'

const STATUS_TONE = { present: 'green', absent: 'red', late: 'amber' }

export default function AttendanceView({ baseUrl, token, subdomain }) {
  const [tab, setTab] = useState('records')
  return (
    <div>
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: COLORS.border }}>
        {[{ key: 'records', label: 'Daily Records' }, { key: 'insights', label: 'Low Attendance' }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className="px-4 py-2.5 text-sm font-medium -mb-px"
            style={{ borderBottom: tab === t.key ? `2px solid ${COLORS.navyAccent}` : '2px solid transparent', color: tab === t.key ? COLORS.navyAccent : COLORS.textSecondary }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'records' && <DailyRecords baseUrl={baseUrl} token={token} subdomain={subdomain} />}
      {tab === 'insights' && <LowAttendance baseUrl={baseUrl} token={token} subdomain={subdomain} />}
    </div>
  )
}

function DailyRecords({ baseUrl, token, subdomain }) {
  const opts = { token, subdomain }
  const [classes, setClasses] = useState([])
  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { apiFetch(baseUrl, '/classes', opts).then((d) => { setClasses(d); setLoading(false) }).catch((e) => { setError(e.message); setLoading(false) }) }, [])
  useEffect(() => {
    if (!classId) { setRecords([]); return }
    apiFetch(baseUrl, `/attendance?classId=${classId}&date=${date}`, opts).then(setRecords).catch((e) => setError(e.message))
  }, [classId, date])

  const { visibleItems: visibleRecords, hasMore, sentinelRef } = useInfiniteScroll(records, 20)
  if (loading) return <Spinner label="Loading…" />
  

  return (
    <div>
      <ErrorBanner message={error} />
      <div className="flex gap-3 mb-5 flex-wrap items-end">
        <div style={{ minWidth: 180 }}>
          <div className="text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>Class</div>
          <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Select class…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div>
          <div className="text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>Date</div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2.5 rounded text-sm" style={{ border: `1px solid ${COLORS.border}` }} />
        </div>
      </div>
      {!classId && <EmptyState icon={Eye} title="Select a class to view attendance" />}
      {classId && records.length === 0 && <EmptyState icon={CalendarCheck} title="No attendance marked for this date" />}
      {records.length > 0 && (
        <>
          <div className="bg-white rounded overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
            {visibleRecords.map((r, i) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i < visibleRecords.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>{r.student?.fullName}</div>
                  <div className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: "'IBM Plex Mono', monospace" }}>{r.student?.studentIdNumber}</div>
                </div>
                <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
              </div>
            ))}
          </div>
          <InfiniteScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
        </>
        
      )}
    </div>
  )
}

function LowAttendance({ baseUrl, token, subdomain }) {
  const opts = { token, subdomain }
  const [termId, setTermId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { apiFetch(baseUrl, '/terms/active', opts).then((t) => setTermId(t.id)).catch(() => setLoading(false)) }, [])
  useEffect(() => {
    if (!termId) return
    setLoading(true)
    apiFetch(baseUrl, `/attendance/low?termId=${termId}&threshold=75`, opts).then(setRows).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [termId])

  const { visibleItems: visibleRows, hasMore, sentinelRef } = useInfiniteScroll(rows, 20)

  if (loading) return <Spinner label="Loading…" />
  if (!termId) return <EmptyState icon={CalendarCheck} title="No active term" />
  
  return (
    <div className="bg-white rounded" style={{ border: `1px solid ${COLORS.border}` }}>
      <div className="px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        <h3 className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>Students below 75% attendance this term</h3>
      </div>
      <ErrorBanner message={error} />
      {rows.length === 0 && <div className="px-5 py-8 text-sm text-center" style={{ color: COLORS.textSecondary }}>No students below the threshold.</div>}
      {visibleRows.map((s) => (
        <div key={s.studentId} className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div>
            <div className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>{s.studentName}</div>
            <div className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: "'IBM Plex Mono', monospace" }}>{s.studentIdNumber}</div>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: COLORS.red }}>
            <TrendingDown size={14} /><span className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.attendancePercentage}%</span>
          </div>
        </div>
      ))}
      <InfiniteScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
    </div>
  )
}