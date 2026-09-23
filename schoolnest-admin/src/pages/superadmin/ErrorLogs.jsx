// ============================================================
// [SUPER ADMIN PORTAL] — Error Logs
// Every error across every school, filterable by school and
// severity, with resolve tracking. Uses REAL server-side
// pagination (unlike the client-side infinite scroll elsewhere)
// since this endpoint genuinely supports skip/take.
// ============================================================
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { AlertTriangle, AlertCircle, CheckCircle2, Search, X } from 'lucide-react'
import { COLORS, formatDate } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Badge, Spinner, ErrorBanner, Select, EmptyState } from '../../components/ui'
import Modal from '../../components/Modal'

export default function ErrorLogs({ baseUrl, token, initialSchoolId, initialSchoolName, onClearSchoolFilter }) {
  const opts = { token }
  const [errors, setErrors] = useState([])
  const [schoolId, setSchoolId] = useState(initialSchoolId || '')
  const [severity, setSeverity] = useState('server') // default to server errors — the ones that need debugging
  const [resolved, setResolved] = useState('false')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const sentinelRef = useRef(null)

  useEffect(() => { setSchoolId(initialSchoolId || '') }, [initialSchoolId])

  async function load(pageNum, append) {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ page: pageNum, limit: 25 })
      if (schoolId) params.set('schoolId', schoolId)
      if (severity) params.set('severity', severity)
      if (resolved) params.set('resolved', resolved)
      const data = await apiFetch(baseUrl, `/super-admin/errors?${params}`, opts)
      setErrors((prev) => (append ? [...prev, ...data.errors] : data.errors))
      setTotalPages(data.totalPages)
      setPage(pageNum)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  useEffect(() => { load(1, false) }, [schoolId, severity, resolved])

  const loadMore = useCallback(() => {
    if (page < totalPages && !loading) load(page + 1, true)
  }, [page, totalPages, loading])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) loadMore() }, { rootMargin: '200px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [loadMore])

  async function markResolved(id) {
    try {
      await apiFetch(baseUrl, `/super-admin/errors/${id}/resolve`, { ...opts, method: 'PATCH' })
      setErrors((prev) => prev.map((e) => e.id === id ? { ...e, resolved: true } : e))
      if (selected?.id === id) setSelected({ ...selected, resolved: true })
    } catch (err) { setError(err.message) }
  }

  return (
    <div>
      <ErrorBanner message={error} />

      {schoolId && (
        <div className="flex items-center justify-between rounded px-4 py-2.5 mb-4" style={{ backgroundColor: COLORS.surface }}>
          <span className="text-sm" style={{ color: COLORS.textPrimary }}>
            Showing errors for <strong>{initialSchoolName || schoolId}</strong>
          </span>
          <button onClick={() => { setSchoolId(''); onClearSchoolFilter?.() }} className="flex items-center gap-1 text-xs font-medium" style={{ color: COLORS.navyAccent }}>
            <X size={13} /> Clear filter
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ maxWidth: 170 }}>
          <option value="server">Server errors (500+)</option>
          <option value="client">Client errors (400-499)</option>
          <option value="">All errors</option>
        </Select>
        <Select value={resolved} onChange={(e) => setResolved(e.target.value)} style={{ maxWidth: 150 }}>
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
          <option value="">All</option>
        </Select>
      </div>

      {!loading && errors.length === 0 && <EmptyState icon={CheckCircle2} title="No errors match this filter" sub="Good sign — nothing here." />}

      <div className="space-y-2">
        {errors.map((e) => (
          <button key={e.id} onClick={() => setSelected(e)}
            className="w-full text-left bg-white rounded p-4 flex items-start justify-between hover:bg-gray-50"
            style={{ border: `1px solid ${COLORS.border}`, opacity: e.resolved ? 0.6 : 1 }}>
            <div className="flex items-start gap-3">
              {e.statusCode >= 500
                ? <AlertTriangle size={16} style={{ color: COLORS.red, marginTop: 2 }} />
                : <AlertCircle size={16} style={{ color: COLORS.amber, marginTop: 2 }} />}
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: COLORS.surface, color: COLORS.textSecondary }}>{e.method}</span>
                  <span className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: "'IBM Plex Mono', monospace" }}>{e.path}</span>
                  <Badge tone={e.statusCode >= 500 ? 'red' : 'amber'}>{e.statusCode}</Badge>
                  {e.resolved && <Badge tone="green">Resolved</Badge>}
                </div>
                <div className="text-sm" style={{ color: COLORS.textPrimary }}>{e.message}</div>
                <div className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
                  {e.school?.name || 'Platform-level'} · {formatDate(e.createdAt)}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {page < totalPages && (
        <div ref={sentinelRef} className="flex items-center justify-center py-4">
          <Spinner label="Loading more…" />
        </div>
      )}

      {selected && (
        <Modal title="Error detail" onClose={() => setSelected(null)} width="max-w-2xl">
          <div className="space-y-3 mb-4">
            <Row label="School" value={selected.school?.name || 'Platform-level'} />
            <Row label="Endpoint" value={`${selected.method} ${selected.path}`} mono />
            <Row label="Status" value={String(selected.statusCode)} />
            <Row label="Message" value={selected.message} />
            <Row label="Occurred" value={formatDate(selected.createdAt)} />
          </div>
          {selected.stack && (
            <div className="mb-4">
              <div className="text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>STACK TRACE</div>
              <pre className="text-xs p-3 rounded overflow-x-auto" style={{ backgroundColor: COLORS.surface, color: COLORS.textPrimary, whiteSpace: 'pre-wrap' }}>
                {selected.stack}
              </pre>
            </div>
          )}
          {!selected.resolved && (
            <Button variant="green" onClick={() => markResolved(selected.id)}><CheckCircle2 size={14} /> Mark resolved</Button>
          )}
        </Modal>
      )}
    </div>
  )
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-medium flex-shrink-0" style={{ color: COLORS.textSecondary }}>{label}</span>
      <span className="text-sm text-right" style={{ color: COLORS.textPrimary, fontFamily: mono ? "'IBM Plex Mono', monospace" : undefined }}>{value}</span>
    </div>
  )
}