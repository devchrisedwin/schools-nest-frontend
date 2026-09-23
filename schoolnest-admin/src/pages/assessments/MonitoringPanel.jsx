// ============================================================
// [SCHOOL ADMIN PORTAL] — Live Exam Monitoring
// Shows students currently taking a published assessment, their
// time remaining, and proctoring violation counts. Polls every
// 5 seconds while open.
// ============================================================
import React, { useState, useEffect } from 'react'
import { ArrowLeft, AlertTriangle, Clock } from 'lucide-react'
import { COLORS } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Badge, Spinner, ErrorBanner, EmptyState } from '../../components/ui'

export default function MonitoringPanel({ baseUrl, opts, assessment, onBack }) {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    try {
      const data = await apiFetch(baseUrl, `/assessments/${assessment.id}/monitoring`, opts)
      setAttempts(data)
      setError('')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  async function terminate(attemptId) {
    if (!window.confirm('End this attempt now?')) return
    try {
      await apiFetch(baseUrl, `/attempts/${attemptId}/terminate-by-teacher`, { ...opts, method: 'POST' })
      await load()
    } catch (err) { setError(err.message) }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  if (loading) return <Spinner label="Loading live monitoring…" />

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium mb-4" style={{ color: COLORS.navyAccent }}>
        <ArrowLeft size={15} /> Back to assessments
      </button>

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold" style={{ color: COLORS.textPrimary }}>{assessment.title} — live</h2>
        <span className="text-xs flex items-center gap-1.5" style={{ color: COLORS.textSecondary }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.green }} /> Updating every 5s
        </span>
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
                {a.violationCount > 0 && (
                  <Badge tone="red"><AlertTriangle size={11} className="inline mr-1" />{a.violationCount} violation{a.violationCount > 1 ? 's' : ''}</Badge>
                )}
              </div>
            </div>
            <Button size="sm" variant="red" onClick={() => terminate(a.attemptId)}>End attempt</Button>
          </div>
        ))}
      </div>
    </div>
  )
}