// ============================================================
// [SCHOOL ADMIN PORTAL] — Assessments & Exams (UPDATED — view only)
// Admin VIEWS assessments/questions/live monitoring and may end
// a runaway attempt (oversight). Creating/editing/publishing is
// teacher-only — done outside this console.
// ============================================================
import React, { useState, useEffect } from 'react'
import { FileQuestion, ChevronRight, ArrowLeft, Activity, Clock, AlertTriangle, Check } from 'lucide-react'
import { COLORS, formatDate } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Badge, Spinner, ErrorBanner, EmptyState } from '../../components/ui'
import ConfirmModal from '../../components/ConfirmModal'
import InfiniteScrollSentinel from '../../components/InfiniteScrollSentinel'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'

export default function AssessmentsHome({ baseUrl, token, subdomain }) {
  const opts = { token, subdomain }
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detailId, setDetailId] = useState(null)
  const [monitorId, setMonitorId] = useState(null)

  async function load() {
    setLoading(true); setError('')
    try { setAssessments(await apiFetch(baseUrl, '/assessments', opts)) }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [baseUrl, token, subdomain])

  const { visibleItems: visibleAssessments, hasMore, sentinelRef } = useInfiniteScroll(assessments, 12)
  if (detailId) return <AssessmentDetail baseUrl={baseUrl} opts={opts} assessmentId={detailId} onBack={() => setDetailId(null)} />
  if (monitorId) return <MonitoringPanel baseUrl={baseUrl} opts={opts} assessment={assessments.find((a) => a.id === monitorId)} onBack={() => setMonitorId(null)} />
  if (loading) return <Spinner label="Loading assessments…" />
   

  return (
    <div>
      <ErrorBanner message={error} />
      {assessments.length === 0 && <EmptyState icon={FileQuestion} title="No assessments yet" sub="Teachers create tests and exams — they'll appear here for you to review." />}
      <div className="space-y-3">
        {visibleAssessments.map((a) => (
          <div key={a.id} className="bg-white rounded p-4 flex items-center justify-between" style={{ border: `1px solid ${COLORS.border}` }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>{a.title}</span>
                <Badge tone="neutral">{a.type.replace('_', ' ')}</Badge>
                {a.isPublished ? <Badge tone="green">Published</Badge> : <Badge tone="amber">Draft</Badge>}
              </div>
              <div className="text-xs" style={{ color: COLORS.textSecondary }}>{a.subject?.name} · {a.class?.name} {a.arm?.name} · {a._count?.questions ?? 0} questions · {formatDate(a.scheduledAt)}</div>
            </div>
            <div className="flex items-center gap-1.5">
              {a.isPublished && <Button size="sm" variant="ghost" onClick={() => setMonitorId(a.id)}><Activity size={13} /> Monitor</Button>}
              <Button size="sm" variant="ghost" onClick={() => setDetailId(a.id)}>View <ChevronRight size={13} /></Button>
            </div>
          </div>
        ))}
      </div>
      <InfiniteScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
    </div>
  )
}

function AssessmentDetail({ baseUrl, opts, assessmentId, onBack }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { apiFetch(baseUrl, `/assessments/${assessmentId}`, opts).then(setDetail).catch((e) => setError(e.message)).finally(() => setLoading(false)) }, [assessmentId])
  if (loading) return <Spinner label="Loading assessment…" />

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium mb-4" style={{ color: COLORS.navyAccent }}><ArrowLeft size={15} /> Back to assessments</button>
      <ErrorBanner message={error} />
      {detail && (
        <>
          <div className="mb-5">
            <h2 className="text-base font-semibold" style={{ color: COLORS.textPrimary }}>{detail.title}</h2>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>{detail.subject?.name} · {detail.class?.name} {detail.arm?.name} · {detail.durationMinutes} min · {detail.maxAttempts} attempt(s)</p>
          </div>
          <div className="space-y-3">
            {detail.questions.map((q, i) => (
              <div key={q.id} className="bg-white rounded p-4" style={{ border: `1px solid ${COLORS.border}` }}>
                <div className="text-sm font-medium mb-3" style={{ color: COLORS.textPrimary }}>{i + 1}. {q.questionText}</div>
                <div className="grid grid-cols-2 gap-2">
                  {['A', 'B', 'C', 'D'].map((letter) => {
                    const isCorrect = q.correctOption === letter.toLowerCase()
                    return (
                      <div key={letter} className="flex items-center gap-2 px-3 py-2 rounded text-sm" style={{ backgroundColor: isCorrect ? '#E8F5EE' : COLORS.surface, color: isCorrect ? COLORS.green : COLORS.textSecondary }}>
                        {isCorrect && <Check size={13} />}<span className="font-medium">{letter}.</span> {q[`option${letter}`]}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function MonitoringPanel({ baseUrl, opts, assessment, onBack }) {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmEnd, setConfirmEnd] = useState(null)

  async function load() {
    try { setAttempts(await apiFetch(baseUrl, `/assessments/${assessment.id}/monitoring`, opts)); setError('') }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load(); const interval = setInterval(load, 5000); return () => clearInterval(interval) }, [])

  async function confirmEndNow() {
    const attemptId = confirmEnd
    setConfirmEnd(null)
    try { await apiFetch(baseUrl, `/attempts/${attemptId}/terminate-by-teacher`, { ...opts, method: 'POST' }); await load() }
    catch (err) { setError(err.message) }
  }
  function formatTime(seconds) { const m = Math.floor(seconds / 60); return `${m}:${String(seconds % 60).padStart(2, '0')}` }

  if (loading) return <Spinner label="Loading live monitoring…" />
 

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium mb-4" style={{ color: COLORS.navyAccent }}><ArrowLeft size={15} /> Back to assessments</button>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold" style={{ color: COLORS.textPrimary }}>{assessment.title} — live</h2>
        <span className="text-xs flex items-center gap-1.5" style={{ color: COLORS.textSecondary }}><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.green }} /> Updating every 5s</span>
      </div>
      <ErrorBanner message={error} />
      {attempts.length === 0 && <EmptyState icon={Clock} title="No students currently taking this assessment" />}
      <div className="space-y-2.5">
        {attempts.map((a) => (
          <div key={a.attemptId} className="bg-white rounded p-4 flex items-center justify-between" style={{ border: `1px solid ${COLORS.border}` }}>
            <div>
              <div className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>{a.studentName}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge tone="neutral"><Clock size={11} className="inline mr-1" />{formatTime(a.remainingSeconds)} left</Badge>
                {a.violationCount > 0 && <Badge tone="red"><AlertTriangle size={11} className="inline mr-1" />{a.violationCount} violation{a.violationCount > 1 ? 's' : ''}</Badge>}
              </div>
            </div>
            <Button size="sm" variant="red" onClick={() => setConfirmEnd(a.attemptId)}>End attempt</Button>
          </div>
        ))}
      </div>
      {confirmEnd && (
        <ConfirmModal title="End this attempt" message="The attempt will be scored on what's answered so far and closed immediately." confirmLabel="End attempt" tone="red"
          onCancel={() => setConfirmEnd(null)} onConfirm={confirmEndNow} />
      )}
    </div>
  )
}