// ============================================================
// [SCHOOL ADMIN PORTAL] — Fee Management
// Create fee items per class+term, view collection dashboard,
// record cash/bank/cheque payments manually.
// (Online Paystack payment happens in the parent's mobile app,
// not here — this console handles setup + manual recording.)
// ============================================================
import React, { useState, useEffect } from 'react'
import { Plus, Wallet, TrendingUp, TrendingDown, DollarSign, Send } from 'lucide-react'
import { COLORS, formatNaira } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Badge, Spinner, ErrorBanner, Field, Input, Select, EmptyState, StatCard } from '../../components/ui'
import Modal from '../../components/Modal'
import InfiniteScrollSentinel from '../../components/InfiniteScrollSentinel'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'items', label: 'Fee Items' },
  { key: 'record', label: 'Record Payment' },
]

export default function FeesManagement({ baseUrl, token, subdomain }) {
  const opts = { token, subdomain }
  const [tab, setTab] = useState('dashboard')
  const [termId, setTermId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch(baseUrl, '/terms/active', opts).then((t) => setTermId(t.id)).catch(() => setError('No active term — open one in Academic Setup first.'))
  }, [])

  

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: COLORS.border }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-medium -mb-px"
            style={{ borderBottom: tab === t.key ? `2px solid ${COLORS.navyAccent}` : '2px solid transparent', color: tab === t.key ? COLORS.navyAccent : COLORS.textSecondary }}>
            {t.label}
          </button>
        ))}
      </div>

      <ErrorBanner message={error} />
      {!termId && !error && <Spinner />}
      {termId && tab === 'dashboard' && <FeeDashboard baseUrl={baseUrl} opts={opts} termId={termId} />}
      {termId && tab === 'items' && <FeeItems baseUrl={baseUrl} opts={opts} termId={termId} />}
      {termId && tab === 'record' && <RecordPayment baseUrl={baseUrl} opts={opts} termId={termId} />}
    </div>
  )
}

function FeeDashboard({ baseUrl, opts, termId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [reminderMsg, setReminderMsg] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      const d = await apiFetch(baseUrl, `/fees/dashboard?termId=${termId}`, opts)
      setData(d)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [termId])

  async function sendReminders() {
    setBusy(true); setReminderMsg('')
    try {
      const res = await apiFetch(baseUrl, `/fees/send-reminders?termId=${termId}`, { ...opts, method: 'POST' })
      setReminderMsg(`Queued reminders to ${res.remindersQueued} parent(s).`)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  if (loading) return <Spinner label="Loading fee dashboard…" />

  return (
    <div>
      <ErrorBanner message={error} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Expected" value={formatNaira(data.totalExpected)} icon={DollarSign} accent="navy" />
        <StatCard label="Collected" value={formatNaira(data.totalCollected)} icon={TrendingUp} accent="green" />
        <StatCard label="Outstanding" value={formatNaira(data.totalOutstanding)} icon={TrendingDown} accent={data.totalOutstanding > 0 ? 'red' : 'green'} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>By class</h3>
        <div className="flex items-center gap-3">
          {reminderMsg && <span className="text-xs" style={{ color: COLORS.green }}>{reminderMsg}</span>}
          <Button size="sm" variant="ghost" onClick={sendReminders} loading={busy}><Send size={13} /> Send reminders</Button>
        </div>
      </div>

      <div className="bg-white rounded overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
              {['Class', 'Expected', 'Collected'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.byClass.map((c) => (
              <tr key={c.classId} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td className="px-4 py-3 font-medium" style={{ color: COLORS.textPrimary }}>{c.className}</td>
                <td className="px-4 py-3" style={{ color: COLORS.textSecondary, fontFamily: "'IBM Plex Mono', monospace" }}>{formatNaira(c.expected)}</td>
                <td className="px-4 py-3" style={{ color: COLORS.green, fontFamily: "'IBM Plex Mono', monospace" }}>{formatNaira(c.collected)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FeeItems({ baseUrl, opts, termId }) {
  const [items, setItems] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  async function load() {
    setLoading(true); setError('')
    try {
      const [itemsData, classesData] = await Promise.all([
        apiFetch(baseUrl, `/fees/items?termId=${termId}`, opts),
        apiFetch(baseUrl, '/classes', opts),
      ])
      setItems(itemsData); setClasses(classesData)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [termId])

  const { visibleItems: visibleFeeRecord, hasMore, sentinelRef } = useInfiniteScroll(items, 20)
  if (loading) return <Spinner label="Loading fee items…" />
  

  return (
    <div>
      <ErrorBanner message={error} />
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreate(true)}><Plus size={15} /> New Fee Item</Button>
      </div>

      {items.length === 0 && <EmptyState icon={Wallet} title="No fee items for this term" sub="Create one, e.g. Tuition — ₦50,000 for JSS 1." />}

      {items.length > 0 && (
        <div className="bg-white rounded overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
                {['Name', 'Class', 'Amount'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleFeeRecord.map((it) => (
                <tr key={it.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td className="px-4 py-3 font-medium" style={{ color: COLORS.textPrimary }}>{it.name}</td>
                  <td className="px-4 py-3" style={{ color: COLORS.textSecondary }}>{it.class?.name}</td>
                  <td className="px-4 py-3" style={{ color: COLORS.textPrimary, fontFamily: "'IBM Plex Mono', monospace" }}>{formatNaira(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <InfiniteScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
        </div>
      )}

      {showCreate && <CreateFeeItemModal baseUrl={baseUrl} opts={opts} termId={termId} classes={classes} onClose={() => setShowCreate(false)} onSaved={load} />}
    </div>
  )
}

function CreateFeeItemModal({ baseUrl, opts, termId, classes, onClose, onSaved }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [classId, setClassId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await apiFetch(baseUrl, '/fees/items', { ...opts, method: 'POST', body: { classId, termId, name, amount: Number(amount) } })
      onSaved(); onClose()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <Modal title="New fee item" onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <Field label="Name"><Input placeholder="e.g. Tuition" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        <Field label="Class">
          <Select value={classId} onChange={(e) => setClassId(e.target.value)} required>
            <option value="">Select a class…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Amount (₦)"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required /></Field>
        <p className="text-xs mb-4" style={{ color: COLORS.textSecondary }}>Applies automatically to every active student in this class.</p>
        <Button type="submit" full loading={loading}>Create fee item</Button>
      </form>
    </Modal>
  )
}

function RecordPayment({ baseUrl, opts, termId }) {
  const [classes, setClasses] = useState([])
  const [classId, setClassId] = useState('')
  const [studentFees, setStudentFees] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [payModal, setPayModal] = useState(null) // studentFee row

  useEffect(() => {
    apiFetch(baseUrl, '/classes', opts).then(setClasses).catch((e) => setError(e.message))
  }, [])

  async function loadClassFees(id) {
    if (!id) { setStudentFees([]); return }
    setLoading(true); setError('')
    try {
      const data = await apiFetch(baseUrl, `/fees/class/${id}?termId=${termId}`, opts)
      setStudentFees(data)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  const { visibleItems: visiblePaymentRecord, hasMore, sentinelRef } = useInfiniteScroll(studentFees, 20)


  return (
    <div>
      <ErrorBanner message={error} />
      <div style={{ maxWidth: 260 }} className="mb-5">
        <div className="text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>Class</div>
        <Select value={classId} onChange={(e) => { setClassId(e.target.value); loadClassFees(e.target.value) }}>
          <option value="">Select a class…</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>

      {loading && <Spinner />}
      {!loading && classId && studentFees.length === 0 && <EmptyState icon={Wallet} title="No fee records for this class" sub="Create a fee item for this class first." />}

      {!loading && studentFees.length > 0 && (
        <div className="bg-white rounded overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
                {['Student', 'Fee', 'Due', 'Paid', 'Balance', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiblePaymentRecord.map((sf) => (
                <tr key={sf.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td className="px-4 py-3 font-medium" style={{ color: COLORS.textPrimary }}>{sf.student.fullName}</td>
                  <td className="px-4 py-3" style={{ color: COLORS.textSecondary }}>{sf.feeItem.name}</td>
                  <td className="px-4 py-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{formatNaira(sf.amountDue)}</td>
                  <td className="px-4 py-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{formatNaira(sf.amountPaid)}</td>
                  <td className="px-4 py-3" style={{ fontFamily: "'IBM Plex Mono', monospace", color: sf.balance > 0 ? COLORS.red : COLORS.green }}>{formatNaira(sf.balance)}</td>
                  <td className="px-4 py-3"><Badge tone={sf.status === 'paid' ? 'green' : sf.status === 'partial' ? 'amber' : 'red'}>{sf.status}</Badge></td>
                  <td className="px-4 py-3">
                    {sf.status !== 'paid' && (
                      <Button size="sm" variant="ghost" onClick={() => setPayModal(sf)}>Record payment</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <InfiniteScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
        </div>
      )}

      {payModal && (
        <RecordPaymentModal baseUrl={baseUrl} opts={opts} termId={termId} studentFee={payModal}
          onClose={() => setPayModal(null)} onSaved={() => loadClassFees(classId)} />
      )}
    </div>
  )
}

function RecordPaymentModal({ baseUrl, opts, termId, studentFee, onClose, onSaved }) {
  const [amount, setAmount] = useState(studentFee.balance)
  const [method, setMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await apiFetch(baseUrl, '/fees/record-cash', {
        ...opts, method: 'POST',
        body: { studentId: studentFee.studentId, feeItemId: studentFee.feeItemId, termId, amount: Number(amount), method },
      })
      onSaved(); onClose()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <Modal title={`Record payment — ${studentFee.student.fullName}`} onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <div className="rounded px-3 py-2.5 mb-4 text-sm" style={{ backgroundColor: COLORS.surface, color: COLORS.textSecondary }}>
          Outstanding balance: <strong style={{ color: COLORS.red }}>{formatNaira(studentFee.balance)}</strong>
        </div>
        <Field label="Amount received (₦)"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required /></Field>
        <Field label="Method">
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
          </Select>
        </Field>
        <Button type="submit" full variant="green" loading={loading}>Record payment</Button>
      </form>
    </Modal>
  )
}