// ============================================================
// [SUPER ADMIN PORTAL] — Schools
// Platform-wide school list, detail view, suspend/reactivate,
// manual subscription override, and permanent deletion (typed
// subdomain confirmation required).
// ============================================================
import React, { useState, useEffect } from 'react'
import { Search, Building2, ArrowLeft, Ban, CheckCircle2, Settings2, Trash2 } from 'lucide-react'
import { COLORS, formatDate, formatNaira } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Badge, Spinner, ErrorBanner, Field, Input, Select, EmptyState } from '../../components/ui'
import Modal from '../../components/Modal'
import ConfirmModal from '../../components/ConfirmModal'

const STATUS_TONE = { active: 'green', trial: 'amber', lapsed: 'red', suspended: 'red' }

export default function SchoolsManagement({ baseUrl, token, onViewSchoolErrors }) {
  const opts = { token }
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedId, setSelectedId] = useState(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ page, limit: 20, ...(statusFilter ? { status: statusFilter } : {}) })
      const data = await apiFetch(baseUrl, `/super-admin/schools?${params}`, opts)
      setSchools(data.schools); setTotalPages(data.totalPages)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [page, statusFilter])

  const filtered = schools.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.subdomain.toLowerCase().includes(search.toLowerCase()))

  if (selectedId) return <SchoolDetail baseUrl={baseUrl} opts={opts} schoolId={selectedId} onBack={() => { setSelectedId(null); load() }} onViewErrors={onViewSchoolErrors} />
  if (loading) return <Spinner label="Loading schools…" />

  return (
    <div>
      <ErrorBanner message={error} />
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textSecondary }} />
          <Input placeholder="Search schools…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} style={{ maxWidth: 160 }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
      </div>

      {filtered.length === 0 && <EmptyState icon={Building2} title="No schools found" />}

      {filtered.length > 0 && (
        <div className="bg-white rounded overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
                {['School', 'Subdomain', 'Users', 'Subscription', 'Status', 'Registered'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} onClick={() => setSelectedId(s.id)} className="cursor-pointer hover:bg-gray-50" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td className="px-4 py-3 font-medium" style={{ color: COLORS.textPrimary }}>{s.name}</td>
                  <td className="px-4 py-3" style={{ color: COLORS.textSecondary, fontFamily: "'IBM Plex Mono', monospace" }}>{s.subdomain}</td>
                  <td className="px-4 py-3" style={{ color: COLORS.textSecondary }}>{s._count?.users ?? '—'}</td>
                  <td className="px-4 py-3">{s.subscription ? <Badge tone={STATUS_TONE[s.subscription.status]}>{s.subscription.status}</Badge> : <Badge tone="neutral">None</Badge>}</td>
                  <td className="px-4 py-3">{s.isSuspended ? <Badge tone="red">Suspended</Badge> : <Badge tone="green">Active</Badge>}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: COLORS.textSecondary }}>{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="text-xs" style={{ color: COLORS.textSecondary }}>Page {page} of {totalPages}</span>
          <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
        </div>
      )}
    </div>
  )
}

function SchoolDetail({ baseUrl, opts, schoolId, onBack, onViewErrors }) {
  const [school, setSchool] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null) // 'suspend' | 'reactivate'
  const [showOverride, setShowOverride] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  async function load() {
    setLoading(true); setError('')
    try { setSchool(await apiFetch(baseUrl, `/super-admin/schools/${schoolId}`, opts)) }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [schoolId])

  async function runAction() {
    const action = confirmAction
    setConfirmAction(null); setBusy(true)
    try { await apiFetch(baseUrl, `/super-admin/schools/${schoolId}/${action}`, { ...opts, method: 'PATCH' }); await load() }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  if (loading) return <Spinner label="Loading school…" />
  if (!school) return <ErrorBanner message={error} />

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium mb-4" style={{ color: COLORS.navyAccent }}>
        <ArrowLeft size={15} /> Back to schools
      </button>
      <ErrorBanner message={error} />

      <div className="bg-white rounded p-5 mb-5" style={{ border: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold" style={{ color: COLORS.textPrimary }}>{school.name}</h2>
            <span className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: "'IBM Plex Mono', monospace" }}>{school.subdomain}</span>
          </div>
          {school.isSuspended ? <Badge tone="red">Suspended</Badge> : <Badge tone="green">Active</Badge>}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-5">
          <Stat label="Users" value={school._count?.users ?? '—'} />
          <Stat label="Students" value={school._count?.students ?? '—'} />
          <Stat label="Subscription" value={school.subscription?.status ?? 'None'} />
          <button onClick={() => onViewErrors(schoolId, school.name)} className="text-left">
            <div className="text-xs mb-0.5" style={{ color: COLORS.textSecondary }}>Errors</div>
            <div className="text-base font-semibold" style={{ color: school.errorSummary.unresolved > 0 ? COLORS.red : COLORS.textPrimary, fontFamily: "'IBM Plex Mono', monospace" }}>
                {school.errorSummary.unresolved} unresolved
            </div>
           </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {school.isSuspended
            ? <Button variant="green" onClick={() => setConfirmAction('reactivate')} loading={busy}><CheckCircle2 size={14} /> Reactivate</Button>
            : <Button variant="red" onClick={() => setConfirmAction('suspend')} loading={busy}><Ban size={14} /> Suspend</Button>}
          <Button variant="ghost" onClick={() => setShowOverride(true)}><Settings2 size={14} /> Override subscription</Button>
          <Button variant="red" onClick={() => setShowDelete(true)}><Trash2 size={14} /> Delete school</Button>
        </div>
      </div>

      {school.subscription && (
        <div className="bg-white rounded p-5" style={{ border: `1px solid ${COLORS.border}` }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>Subscription</h3>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><span style={{ color: COLORS.textSecondary }}>Billing cycle:</span> <span className="capitalize" style={{ color: COLORS.textPrimary }}>{school.subscription.billingCycle}</span></div>
            <div><span style={{ color: COLORS.textSecondary }}>Price/student:</span> <span style={{ color: COLORS.textPrimary }}>{formatNaira(school.subscription.pricePerStudent)}</span></div>
            <div><span style={{ color: COLORS.textSecondary }}>Next billing:</span> <span style={{ color: COLORS.textPrimary }}>{formatDate(school.subscription.nextBillingDate)}</span></div>
          </div>
          {school.subscription.paymentRecords?.length > 0 && (
            <>
              <h4 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.textSecondary }}>Recent payments</h4>
              {school.subscription.paymentRecords.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 text-xs" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <span style={{ color: COLORS.textSecondary }}>{formatDate(p.paidAt)}</span>
                  <span style={{ color: COLORS.textPrimary, fontFamily: "'IBM Plex Mono', monospace" }}>{formatNaira(p.amount)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {confirmAction && (
        <ConfirmModal
          title={confirmAction === 'suspend' ? 'Suspend school' : 'Reactivate school'}
          message={confirmAction === 'suspend' ? 'This school will lose access to every part of the platform except billing. Data is preserved.' : 'This school regains full access immediately.'}
          confirmLabel={confirmAction === 'suspend' ? 'Suspend' : 'Reactivate'}
          tone={confirmAction === 'suspend' ? 'red' : 'green'}
          onCancel={() => setConfirmAction(null)} onConfirm={runAction} loading={busy}
        />
      )}
      {showOverride && <OverrideModal baseUrl={baseUrl} opts={opts} schoolId={schoolId} onClose={() => setShowOverride(false)} onSaved={load} />}
      {showDelete && <DeleteModal baseUrl={baseUrl} opts={opts} school={school} onClose={() => setShowDelete(false)} onDeleted={onBack} />}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-xs mb-0.5" style={{ color: COLORS.textSecondary }}>{label}</div>
      <div className="text-base font-semibold capitalize" style={{ color: COLORS.textPrimary, fontFamily: "'IBM Plex Mono', monospace" }}>{value}</div>
    </div>
  )
}

function OverrideModal({ baseUrl, opts, schoolId, onClose, onSaved }) {
  const [status, setStatus] = useState('')
  const [nextBillingDate, setNextBillingDate] = useState('')
  const [pricePerStudent, setPricePerStudent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const body = {}
    if (status) body.status = status
    if (nextBillingDate) body.nextBillingDate = nextBillingDate
    if (pricePerStudent) body.pricePerStudent = Number(pricePerStudent)
    try {
      await apiFetch(baseUrl, `/super-admin/schools/${schoolId}/override-plan`, { ...opts, method: 'PATCH', body })
      onSaved(); onClose()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <Modal title="Override subscription" onClose={onClose}>
      <ErrorBanner message={error} />
      <p className="text-xs mb-4" style={{ color: COLORS.textSecondary }}>Leave any field blank to leave it unchanged. Used for comping a school or resolving a billing dispute.</p>
      <form onSubmit={submit}>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">No change</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="lapsed">Lapsed</option>
            <option value="suspended">Suspended</option>
          </Select>
        </Field>
        <Field label="Next billing date"><Input type="date" value={nextBillingDate} onChange={(e) => setNextBillingDate(e.target.value)} /></Field>
        <Field label="Price per student (₦)"><Input type="number" value={pricePerStudent} onChange={(e) => setPricePerStudent(e.target.value)} /></Field>
        <Button type="submit" full loading={loading}>Save override</Button>
      </form>
    </Modal>
  )
}

function DeleteModal({ baseUrl, opts, school, onClose, onDeleted }) {
  const [confirmationToken, setConfirmationToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await apiFetch(baseUrl, `/super-admin/schools/${school.id}`, { ...opts, method: 'DELETE', body: { confirmationToken } })
      onDeleted()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <Modal title="Delete school permanently" onClose={onClose}>
      <ErrorBanner message={error} />
      <p className="text-sm mb-4" style={{ color: COLORS.red }}>
        This permanently deletes {school.name} and everything under it — students, staff, scores, everything. This cannot be undone.
      </p>
      <form onSubmit={submit}>
        <Field label={`Type "${school.subdomain}" to confirm`}>
          <Input value={confirmationToken} onChange={(e) => setConfirmationToken(e.target.value)} style={{ fontFamily: "'IBM Plex Mono', monospace" }} required />
        </Field>
        <Button type="submit" full variant="red" loading={loading} disabled={confirmationToken !== school.subdomain}>Permanently delete</Button>
      </form>
    </Modal>
  )
}