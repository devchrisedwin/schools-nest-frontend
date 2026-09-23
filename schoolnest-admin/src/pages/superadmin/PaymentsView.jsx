// ============================================================
// [SUPER ADMIN PORTAL] — Payments
// Every subscription payment across every school on the platform.
// ============================================================
import React, { useState, useEffect } from 'react'
import { CreditCard } from 'lucide-react'
import { COLORS, formatDate, formatNaira } from '../../theme'
import { apiFetch } from '../../api'
import { Spinner, ErrorBanner, Button, EmptyState } from '../../components/ui'

export default function PaymentsView({ baseUrl, token }) {
  const opts = { token }
  const [payments, setPayments] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      const data = await apiFetch(baseUrl, `/super-admin/payments?page=${page}&limit=20`, opts)
      setPayments(data.payments); setTotalPages(data.totalPages)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [page])

  if (loading) return <Spinner label="Loading payments…" />

  return (
    <div>
      <ErrorBanner message={error} />
      {payments.length === 0 && <EmptyState icon={CreditCard} title="No payments yet" />}
      {payments.length > 0 && (
        <div className="bg-white rounded overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
                {['School', 'Amount', 'Method', 'Reference', 'Date'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td className="px-4 py-3 font-medium" style={{ color: COLORS.textPrimary }}>{p.subscription?.school?.name || '—'}</td>
                  <td className="px-4 py-3" style={{ color: COLORS.textPrimary, fontFamily: "'IBM Plex Mono', monospace" }}>{formatNaira(p.amount)}</td>
                  <td className="px-4 py-3 capitalize" style={{ color: COLORS.textSecondary }}>{p.method}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: COLORS.textSecondary, fontFamily: "'IBM Plex Mono', monospace" }}>{p.paystackReference || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: COLORS.textSecondary }}>{formatDate(p.paidAt)}</td>
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