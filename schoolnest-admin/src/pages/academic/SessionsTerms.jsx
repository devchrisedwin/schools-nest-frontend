// ============================================================
// [SCHOOL ADMIN PORTAL] — Sessions & Terms (UPDATED)
// Each session is now collapsible; the sessions list uses
// infinite scroll (client-side reveal — see note in useInfiniteScroll.js).
// ============================================================
import React, { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Lock, Unlock, Calendar } from 'lucide-react'
import { COLORS, formatDate } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Badge, Spinner, ErrorBanner, Field, Input, Select, EmptyState } from '../../components/ui'
import Modal from '../../components/Modal'
import ConfirmModal from '../../components/ConfirmModal'
import Collapsible from '../../components/Collapsible'
import InfiniteScrollSentinel from '../../components/InfiniteScrollSentinel'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'

export default function SessionsTerms({ baseUrl, token, subdomain }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showTermModal, setShowTermModal] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [confirmClose, setConfirmClose] = useState(null)

  const opts = { token, subdomain }
  const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll(sessions, 10)

  async function load() {
    setLoading(true); setError('')
    try { setSessions(await apiFetch(baseUrl, '/sessions', opts)) }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [baseUrl, token, subdomain])

  async function activateSession(id) {
    setBusyId(id)
    try { await apiFetch(baseUrl, `/sessions/${id}/activate`, { ...opts, method: 'PATCH' }); await load() }
    catch (err) { setError(err.message) } finally { setBusyId(null) }
  }

  async function confirmCloseNow() {
    const id = confirmClose
    setConfirmClose(null); setBusyId(id)
    try { await apiFetch(baseUrl, `/sessions/${id}/close`, { ...opts, method: 'PATCH' }); await load() }
    catch (err) { setError(err.message) } finally { setBusyId(null) }
  }

  async function toggleTerm(termId, currentlyOpen) {
    setBusyId(termId)
    try { await apiFetch(baseUrl, `/terms/${termId}/${currentlyOpen ? 'close' : 'open'}`, { ...opts, method: 'PATCH' }); await load() }
    catch (err) { setError(err.message) } finally { setBusyId(null) }
  }

  if (loading) return <Spinner label="Loading sessions…" />

  return (
    <div>
      <ErrorBanner message={error} />
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowSessionModal(true)}><Plus size={15} /> New Session</Button>
      </div>

      {sessions.length === 0 && <EmptyState icon={Calendar} title="No academic sessions yet" sub="Create your first session to get started." />}

      <div className="space-y-3">
        {visibleItems.map((s) => (
          <Collapsible
            key={s.id}
            title={s.name}
            defaultOpen={s.isActive}
            headerRight={
              <div className="flex items-center gap-2">
                {s.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
                {!s.isActive && (
                  <Button size="sm" variant="ghost" onClick={() => activateSession(s.id)} disabled={busyId === s.id}><CheckCircle2 size={13} /> Activate</Button>
                )}
                {s.isActive && (
                  <Button size="sm" variant="red" onClick={() => setConfirmClose(s.id)} disabled={busyId === s.id}>Close session</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setShowTermModal(s.id)}><Plus size={13} /> Add Term</Button>
              </div>
            }
          >
            {s.terms.length === 0 && <div className="text-xs" style={{ color: COLORS.textSecondary }}>No terms added yet.</div>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {s.terms.map((t) => (
                <div key={t.id} className="rounded px-3.5 py-3" style={{ border: `1px solid ${COLORS.border}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize" style={{ color: COLORS.textPrimary }}>{t.name} term</span>
                    {t.isOpen ? <Badge tone="green">Open</Badge> : <Badge tone="neutral">Closed</Badge>}
                  </div>
                  <div className="text-xs mb-3" style={{ color: COLORS.textSecondary }}>{formatDate(t.startDate)} — {formatDate(t.endDate)}</div>
                  <Button size="sm" full variant={t.isOpen ? 'red' : 'green'} onClick={() => toggleTerm(t.id, t.isOpen)} disabled={busyId === t.id} loading={busyId === t.id}>
                    {t.isOpen ? <><Lock size={13} /> Close term</> : <><Unlock size={13} /> Open term</>}
                  </Button>
                </div>
              ))}
            </div>
          </Collapsible>
        ))}
      </div>

      <InfiniteScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />

      {showSessionModal && <SessionModal baseUrl={baseUrl} opts={opts} onClose={() => setShowSessionModal(false)} onSaved={load} />}
      {showTermModal && <TermModal baseUrl={baseUrl} opts={opts} sessionId={showTermModal} onClose={() => setShowTermModal(null)} onSaved={load} />}
      {confirmClose && (
        <ConfirmModal title="Close session" message="This session will no longer be active. You can reactivate it later." confirmLabel="Close session" tone="red"
          onCancel={() => setConfirmClose(null)} onConfirm={confirmCloseNow} />
      )}
    </div>
  )
}

function SessionModal({ baseUrl, opts, onClose, onSaved }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try { await apiFetch(baseUrl, '/sessions', { ...opts, method: 'POST', body: { name } }); onSaved(); onClose() }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <Modal title="New academic session" onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <Field label="Session name"><Input placeholder="e.g. 2025/2026" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        <Button type="submit" full loading={loading}>Create session</Button>
      </form>
    </Modal>
  )
}

function TermModal({ baseUrl, opts, sessionId, onClose, onSaved }) {
  const [name, setName] = useState('first')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try { await apiFetch(baseUrl, `/sessions/${sessionId}/terms`, { ...opts, method: 'POST', body: { name, startDate, endDate } }); onSaved(); onClose() }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <Modal title="Add term" onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <Field label="Term">
          <Select value={name} onChange={(e) => setName(e.target.value)}>
            <option value="first">First</option><option value="second">Second</option><option value="third">Third</option>
          </Select>
        </Field>
        <Field label="Start date"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></Field>
        <Field label="End date"><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required /></Field>
        <Button type="submit" full loading={loading}>Add term</Button>
      </form>
    </Modal>
  )
}