// ============================================================
// [SCHOOL ADMIN PORTAL] — Classes & Arms (UPDATED)
// Each class is now collapsible; classes list uses infinite scroll.
// ============================================================
import React, { useState, useEffect } from 'react'
import { Plus, Archive, Users, School } from 'lucide-react'
import { COLORS } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Spinner, ErrorBanner, Field, Input, EmptyState } from '../../components/ui'
import Modal from '../../components/Modal'
import ConfirmModal from '../../components/ConfirmModal'
import Collapsible from '../../components/Collapsible'
import InfiniteScrollSentinel from '../../components/InfiniteScrollSentinel'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'

export default function ClassesArms({ baseUrl, token, subdomain }) {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showClassModal, setShowClassModal] = useState(false)
  const [showArmModal, setShowArmModal] = useState(null)
  const [confirmArchive, setConfirmArchive] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const opts = { token, subdomain }
  const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll(classes, 10)

  async function load() {
    setLoading(true); setError('')
    try { setClasses(await apiFetch(baseUrl, '/classes', opts)) }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [baseUrl, token, subdomain])

  async function confirmArchiveNow() {
    const id = confirmArchive
    setConfirmArchive(null); setBusyId(id)
    try { await apiFetch(baseUrl, `/classes/${id}/archive`, { ...opts, method: 'PATCH' }); await load() }
    catch (err) { setError(err.message) } finally { setBusyId(null) }
  }

  if (loading) return <Spinner label="Loading classes…" />

  return (
    <div>
      <ErrorBanner message={error} />
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowClassModal(true)}><Plus size={15} /> New Class</Button>
      </div>

      {classes.length === 0 && <EmptyState icon={School} title="No classes yet" sub="Add your first class, e.g. JSS 1." />}

      <div className="space-y-3">
        {visibleItems.map((c) => (
          <Collapsible
            key={c.id}
            title={c.name}
            subtitle={`${c.arms.length} arm(s)`}
            headerRight={
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => setShowArmModal(c.id)}><Plus size={13} /> Arm</Button>
                <button onClick={() => setConfirmArchive(c.id)} disabled={busyId === c.id} className="p-1.5 rounded hover:bg-gray-100">
                  <Archive size={14} style={{ color: COLORS.textSecondary }} />
                </button>
              </div>
            }
          >
            {c.arms.length === 0 && <span className="text-xs" style={{ color: COLORS.textSecondary }}>No arms yet.</span>}
            <div className="flex flex-wrap gap-2">
              {c.arms.map((a) => (
                <div key={a.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs" style={{ backgroundColor: COLORS.surface }}>
                  <span className="font-medium" style={{ color: COLORS.textPrimary }}>{a.name}</span>
                  <span className="flex items-center gap-1" style={{ color: COLORS.textSecondary }}><Users size={11} /> {a._count?.students ?? 0}</span>
                </div>
              ))}
            </div>
          </Collapsible>
        ))}
      </div>

      <InfiniteScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />

      {showClassModal && <ClassModal baseUrl={baseUrl} opts={opts} onClose={() => setShowClassModal(false)} onSaved={load} nextOrder={classes.length + 1} />}
      {showArmModal && <ArmModal baseUrl={baseUrl} opts={opts} classId={showArmModal} onClose={() => setShowArmModal(null)} onSaved={load} />}
      {confirmArchive && (
        <ConfirmModal title="Archive class" message="This class will be hidden from active views." confirmLabel="Archive" tone="red"
          onCancel={() => setConfirmArchive(null)} onConfirm={confirmArchiveNow} />
      )}
    </div>
  )
}

function ClassModal({ baseUrl, opts, onClose, onSaved, nextOrder }) {
  const [name, setName] = useState('')
  const [order, setOrder] = useState(nextOrder)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try { await apiFetch(baseUrl, '/classes', { ...opts, method: 'POST', body: { name, order: Number(order) } }); onSaved(); onClose() }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <Modal title="New class" onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <Field label="Class name"><Input placeholder="e.g. JSS 1" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        <Field label="Promotion order"><Input type="number" min="1" value={order} onChange={(e) => setOrder(e.target.value)} required /></Field>
        <Button type="submit" full loading={loading}>Create class</Button>
      </form>
    </Modal>
  )
}

function ArmModal({ baseUrl, opts, classId, onClose, onSaved }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try { await apiFetch(baseUrl, `/classes/${classId}/arms`, { ...opts, method: 'POST', body: { name } }); onSaved(); onClose() }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <Modal title="Add arm" onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <Field label="Arm name"><Input placeholder="e.g. A" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        <Button type="submit" full loading={loading}>Add arm</Button>
      </form>
    </Modal>
  )
}