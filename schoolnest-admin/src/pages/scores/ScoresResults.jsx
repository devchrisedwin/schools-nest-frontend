// ============================================================
// [SCHOOL ADMIN PORTAL] — Scores & Results (UPDATED — view only)
// Admin VIEWS score sheets and computed results, and computes/
// approves/publishes/unpublishes. Entering or overriding
// individual scores is a teacher-only action (not in this console).
// ============================================================
import React, { useState, useEffect } from 'react'
import { ClipboardList, Calculator, CheckCircle2, Send, EyeOff, Eye } from 'lucide-react'
import { COLORS } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Badge, Spinner, ErrorBanner, Select, EmptyState } from '../../components/ui'
import InfiniteScrollSentinel from '../../components/InfiniteScrollSentinel'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'

const TABS = [{ key: 'overview', label: 'Results Overview' }, { key: 'view', label: 'View Score Sheet' }]

export default function ScoresResults({ baseUrl, token, subdomain }) {
  const [tab, setTab] = useState('overview')
  return (
    <div>
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: COLORS.border }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className="px-4 py-2.5 text-sm font-medium -mb-px"
            style={{ borderBottom: tab === t.key ? `2px solid ${COLORS.navyAccent}` : '2px solid transparent', color: tab === t.key ? COLORS.navyAccent : COLORS.textSecondary }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'overview' && <ResultsOverview baseUrl={baseUrl} token={token} subdomain={subdomain} />}
      {tab === 'view' && <ScoreSheetView baseUrl={baseUrl} token={token} subdomain={subdomain} />}
    </div>
  )
}

function ScoreSheetView({ baseUrl, token, subdomain }) {
  const opts = { token, subdomain }
  const [subjects, setSubjects] = useState([])
  const [classes, setClasses] = useState([])
  const [termId, setTermId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [classId, setClassId] = useState('')
  const [armId, setArmId] = useState('')
  const [sheet, setSheet] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const selectedClass = classes.find((c) => c.id === classId)

  useEffect(() => {
    async function init() {
      setLoading(true); setError('')
      try {
        const [subjectsData, classesData, termData] = await Promise.all([
          apiFetch(baseUrl, '/subjects', opts), apiFetch(baseUrl, '/classes', opts),
          apiFetch(baseUrl, '/terms/active', opts).catch(() => null),
        ])
        setSubjects(subjectsData); setClasses(classesData)
        if (termData) setTermId(termData.id)
      } catch (err) { setError(err.message) } finally { setLoading(false) }
    }
    init()
  }, [baseUrl, token, subdomain])

  useEffect(() => {
    if (!termId || !subjectId || !classId || !armId) { setSheet([]); return }
    setLoading(true)
    apiFetch(baseUrl, `/scores?termId=${termId}&subjectId=${subjectId}&classId=${classId}&armId=${armId}`, opts)
      .then(setSheet).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [termId, subjectId, classId, armId])

  const fields = [{ key: 'test1Score', label: 'Test 1' }, { key: 'test2Score', label: 'Test 2' }, { key: 'test3Score', label: 'Test 3' }, { key: 'examScore', label: 'Exam' }]

  return (
    <div>
      <ErrorBanner message={error} />
      <div className="flex gap-3 mb-5 flex-wrap items-end">
        <Picker label="Class" value={classId} onChange={(v) => { setClassId(v); setArmId('') }} options={classes.map((c) => ({ value: c.id, label: c.name }))} />
        <Picker label="Arm" value={armId} onChange={setArmId} disabled={!selectedClass} options={selectedClass?.arms.map((a) => ({ value: a.id, label: a.name })) || []} />
        <Picker label="Subject" value={subjectId} onChange={setSubjectId} options={subjects.map((s) => ({ value: s.id, label: s.name }))} />
      </div>
      {loading && <Spinner />}
      {!loading && (!termId || !subjectId || !classId || !armId) && <EmptyState icon={Eye} title="Select class, arm, and subject" sub="Choose all three above to view the score sheet." />}
      {!loading && sheet.length > 0 && (
        <div className="bg-white rounded overflow-x-auto" style={{ border: `1px solid ${COLORS.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>Student</th>
                {fields.map((f) => <th key={f.key} className="text-center px-3 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>{f.label}</th>)}
                <th className="text-center px-3 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>Total</th>
                <th className="text-center px-3 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {sheet.map((row) => (
                <tr key={row.studentId} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td className="px-4 py-2.5 font-medium" style={{ color: COLORS.textPrimary }}>{row.studentName}</td>
                  {fields.map((f) => <td key={f.key} className="px-2 py-2 text-center" style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textSecondary }}>{row.score?.[f.key] ?? '—'}</td>)}
                  <td className="px-3 py-2.5 text-center font-semibold" style={{ color: COLORS.textPrimary, fontFamily: "'IBM Plex Mono', monospace" }}>{row.score?.grandTotal ?? '—'}</td>
                  <td className="px-3 py-2.5 text-center">{row.score?.grade ? <Badge tone="neutral">{row.score.grade}</Badge> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Picker({ label, value, onChange, options, disabled }) {
  return (
    <div style={{ minWidth: 160 }}>
      <div className="text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>{label}</div>
      <Select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        <option value="">Select…</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
    </div>
  )
}

function ResultsOverview({ baseUrl, token, subdomain }) {
  const opts = { token, subdomain }
  const [termId, setTermId] = useState('')
  const [overview, setOverview] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyKey, setBusyKey] = useState(null)

  // MOVED UP — must run on every render, before any early return
  const { visibleItems: visibleOverview, hasMore, sentinelRef } = useInfiniteScroll(overview, 15)

  useEffect(() => { apiFetch(baseUrl, '/terms/active', opts).then((t) => setTermId(t.id)).catch(() => setLoading(false)) }, [])

  async function load() {
    if (!termId) return
    setLoading(true); setError('')
    try { setOverview(await apiFetch(baseUrl, `/results/overview?termId=${termId}`, opts)) }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [termId])

  async function runAction(row, action) {
    const key = `${row.classId}-${row.armId}-${action}`
    setBusyKey(key); setError('')
    try {
      if (action === 'compute') await apiFetch(baseUrl, `/results/compute?termId=${termId}&classId=${row.classId}&armId=${row.armId}`, { ...opts, method: 'POST' })
      else await apiFetch(baseUrl, `/results/${action}`, { ...opts, method: 'POST', body: { termId, classId: row.classId, armId: row.armId } })
      await load()
    } catch (err) { setError(err.message) } finally { setBusyKey(null) }
  }

  if (loading) return <Spinner label="Loading results overview…" />
  if (!termId) return <EmptyState icon={ClipboardList} title="No active term" sub="Open a term in Academic Setup to see results here." />

  return (
    <div>
      <ErrorBanner message={error} />
      <div className="bg-white rounded overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
              {['Class', 'Students', 'Computed', 'Approved', 'Published', ''].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {visibleOverview.map((row) => (
              <tr key={`${row.classId}-${row.armId}`} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td className="px-4 py-3 font-medium" style={{ color: COLORS.textPrimary }}>{row.className} {row.armName}</td>
                <td className="px-4 py-3" style={{ color: COLORS.textSecondary, fontFamily: "'IBM Plex Mono', monospace" }}>{row.totalStudents}</td>
                <td className="px-4 py-3">{row.computed > 0 ? <Badge tone="green">{row.computed}</Badge> : <Badge tone="neutral">0</Badge>}</td>
                <td className="px-4 py-3">{row.approved > 0 ? <Badge tone="green">{row.approved}</Badge> : <Badge tone="neutral">0</Badge>}</td>
                <td className="px-4 py-3">{row.published > 0 ? <Badge tone="green">{row.published}</Badge> : <Badge tone="neutral">0</Badge>}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 justify-end">
                    <Button size="sm" variant="ghost" loading={busyKey === `${row.classId}-${row.armId}-compute`} onClick={() => runAction(row, 'compute')}><Calculator size={13} /> Compute</Button>
                    <Button size="sm" variant="ghost" loading={busyKey === `${row.classId}-${row.armId}-approve`} onClick={() => runAction(row, 'approve')} disabled={row.computed === 0}><CheckCircle2 size={13} /> Approve</Button>
                    <Button size="sm" variant="green" loading={busyKey === `${row.classId}-${row.armId}-publish`} onClick={() => runAction(row, 'publish')} disabled={row.approved === 0}><Send size={13} /> Publish</Button>
                    {row.published > 0 && <Button size="sm" variant="red" loading={busyKey === `${row.classId}-${row.armId}-unpublish`} onClick={() => runAction(row, 'unpublish')}><EyeOff size={13} /></Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <InfiniteScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
      </div>
    </div>
  )
}