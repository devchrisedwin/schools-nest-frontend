// ============================================================
// [SCHOOL ADMIN PORTAL] — Billing
// Usage-based billing: flat ₦500/active-student, whichever cycle
// the school chooses. Invoices generate automatically; this
// screen shows status and lets the admin pay or switch cycles.
// ============================================================
import React, { useState, useEffect } from 'react'
import { CreditCard, RefreshCw, ExternalLink, Wallet } from 'lucide-react'
import { COLORS, formatNaira, formatDate } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Badge, Spinner, ErrorBanner, StatCard, Select, EmptyState } from '../../components/ui'
import ConfirmModal from '../../components/ConfirmModal'
import ReferralsCard from './ReferralsCard'

const STATUS_TONE = { active: 'green', trial: 'amber', lapsed: 'red', suspended: 'red' }
const INVOICE_TONE = { paid: 'green', pending: 'amber', overdue: 'red', cancelled: 'neutral' }

export default function BillingHome({ baseUrl, token, subdomain }) {
  const opts = { token, subdomain }
  const [subscription, setSubscription] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmCycle, setConfirmCycle] = useState(null)
  const [payingId, setPayingId] = useState(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const [subData, invoicesData] = await Promise.all([
        apiFetch(baseUrl, '/billing/subscription', opts),
        apiFetch(baseUrl, '/billing/invoices', opts),
      ])
      setSubscription(subData); setInvoices(invoicesData)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [baseUrl, token, subdomain])

  async function confirmCycleNow() {
    const cycle = confirmCycle
    setConfirmCycle(null)
    try { await apiFetch(baseUrl, '/billing/subscription/cycle', { ...opts, method: 'PATCH', body: { billingCycle: cycle } }); await load() }
    catch (err) { setError(err.message) }
  }

  async function payInvoice(invoiceId) {
    setPayingId(invoiceId); setError('')
    try {
      const { authorizationUrl } = await apiFetch(baseUrl, `/billing/invoices/${invoiceId}/pay`, { ...opts, method: 'POST' })
      window.open(authorizationUrl, '_blank')
    } catch (err) { setError(err.message) } finally { setPayingId(null) }
  }

  if (loading) return <Spinner label="Loading billing…" />

  if (!subscription) {
    return <EmptyState icon={CreditCard} title="No subscription found" sub="Contact support — this shouldn't happen for a school registered after billing went live." />
  }

  return (
    <div>
      <ErrorBanner message={error} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Status" value={subscription.status} accent={STATUS_TONE[subscription.status] || 'navy'} />
        <StatCard label="Active students" value={subscription.currentStudentCount} accent="navy" />
        <StatCard label="Next invoice estimate" value={formatNaira(subscription.estimatedNextInvoiceAmount)} sub={`₦500 × ${subscription.currentStudentCount} students`} accent="navy" />
      </div>

      <div className="bg-white rounded p-5 mb-6" style={{ border: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>Billing cycle</h3>
        </div>
        <p className="text-xs mb-4" style={{ color: COLORS.textSecondary }}>
          Next invoice: {formatDate(subscription.nextBillingDate)}. Flat ₦500 per active student, whichever cycle you choose.
        </p>
        <div className="flex items-center gap-3">
          <Select value={subscription.billingCycle} onChange={(e) => setConfirmCycle(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="monthly">Monthly</option>
            <option value="termly">Termly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </div>
      </div>

      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>Invoices</h3>
      {invoices.length === 0 && <EmptyState icon={Wallet} title="No invoices yet" sub="Your first invoice generates automatically when your trial ends." />}
      {invoices.length > 0 && (
        <div className="bg-white rounded overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
                {['Period', 'Students', 'Amount', 'Due', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td className="px-4 py-3 capitalize" style={{ color: COLORS.textPrimary }}>{inv.billingCycle}</td>
                  <td className="px-4 py-3" style={{ color: COLORS.textSecondary, fontFamily: "'IBM Plex Mono', monospace" }}>{inv.studentCount}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: COLORS.textPrimary, fontFamily: "'IBM Plex Mono', monospace" }}>{formatNaira(inv.totalAmount)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: COLORS.textSecondary }}>{formatDate(inv.dueDate)}</td>
                  <td className="px-4 py-3"><Badge tone={INVOICE_TONE[inv.status]}>{inv.status}</Badge></td>
                  <td className="px-4 py-3">
                    {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                      <Button size="sm" variant="green" onClick={() => payInvoice(inv.id)} loading={payingId === inv.id}>
                        <ExternalLink size={12} /> Pay
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <ReferralsCard baseUrl={baseUrl} token={token} subdomain={subdomain} />
      </div>

      {confirmCycle && (
        <ConfirmModal title="Change billing cycle" message={`Switch to ${confirmCycle} billing? This takes effect from your next invoice.`}
          confirmLabel="Confirm" tone="navy" onCancel={() => setConfirmCycle(null)} onConfirm={confirmCycleNow} />
      )}
    </div>
  )
}