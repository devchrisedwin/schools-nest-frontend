// ============================================================
// [SCHOOL ADMIN PORTAL] — Wallet
// Balance from parent fee payments, withdrawal to any bank
// (auto-resolves account holder name via Paystack), full ledger
// and withdrawal history.
// ============================================================
import React, { useState, useEffect } from 'react'
import { Wallet, ArrowDownToLine, TrendingUp, TrendingDown } from 'lucide-react'
import { COLORS, formatNaira, formatDate } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Badge, Spinner, ErrorBanner, StatCard, EmptyState } from '../../components/ui'
import InfiniteScrollSentinel from '../../components/InfiniteScrollSentinel'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import WithdrawModal from './WithdrawModal'

const TABS = [{ key: 'overview', label: 'Overview' }, { key: 'history', label: 'Withdrawal History' }]
const STATUS_TONE = { success: 'green', pending: 'amber', failed: 'red' }

export default function WalletHome({ baseUrl, token, subdomain }) {
  const opts = { token, subdomain }
  const [tab, setTab] = useState('overview')
  const [balance, setBalance] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showWithdraw, setShowWithdraw] = useState(false)

  const { visibleItems: visibleTxns, hasMore: moreTxns, sentinelRef: txnRef } = useInfiniteScroll(transactions, 20)
  const { visibleItems: visibleWithdrawals, hasMore: moreWithdrawals, sentinelRef: wdRef } = useInfiniteScroll(withdrawals, 20)

  async function load() {
    setLoading(true); setError('')
    try {
      const [balanceData, txnData, wdData] = await Promise.all([
        apiFetch(baseUrl, '/wallet', opts),
        apiFetch(baseUrl, '/wallet/transactions', opts),
        apiFetch(baseUrl, '/wallet/withdrawals', opts),
      ])
      setBalance(balanceData); setTransactions(txnData); setWithdrawals(wdData)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [baseUrl, token, subdomain])

  if (loading) return <Spinner label="Loading wallet…" />

  return (
    <div>
      <ErrorBanner message={error} />

      <div className="flex items-center justify-between mb-6">
        <StatCard label="Available Balance" value={formatNaira(balance?.balance)} icon={Wallet} accent="green" />
        <Button variant="green" onClick={() => setShowWithdraw(true)}><ArrowDownToLine size={15} /> Withdraw</Button>
      </div>

      <div className="flex gap-1 mb-5 border-b" style={{ borderColor: COLORS.border }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className="px-4 py-2.5 text-sm font-medium -mb-px"
            style={{ borderBottom: tab === t.key ? `2px solid ${COLORS.navyAccent}` : '2px solid transparent', color: tab === t.key ? COLORS.navyAccent : COLORS.textSecondary }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {transactions.length === 0 && <EmptyState icon={Wallet} title="No wallet activity yet" sub="Fee payments from parents will appear here." />}
          <div className="bg-white rounded overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
            {visibleTxns.map((t, i) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i < visibleTxns.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                <div className="flex items-center gap-3">
                  {t.type === 'credit' ? <TrendingUp size={15} style={{ color: COLORS.green }} /> : <TrendingDown size={15} style={{ color: COLORS.red }} />}
                  <div>
                    <div className="text-sm" style={{ color: COLORS.textPrimary }}>{t.description}</div>
                    <div className="text-xs" style={{ color: COLORS.textSecondary }}>{formatDate(t.createdAt)}</div>
                  </div>
                </div>
                <span className="text-sm font-semibold" style={{ color: t.type === 'credit' ? COLORS.green : COLORS.red, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {t.type === 'credit' ? '+' : '−'}{formatNaira(t.amount)}
                </span>
              </div>
            ))}
          </div>
          <InfiniteScrollSentinel sentinelRef={txnRef} hasMore={moreTxns} />
        </>
      )}

      {tab === 'history' && (
        <>
          {withdrawals.length === 0 && <EmptyState icon={ArrowDownToLine} title="No withdrawals yet" />}
          {withdrawals.length > 0 && (
            <div className="bg-white rounded overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
                    {['Amount', 'Bank', 'Account Name', 'Status', 'Date'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleWithdrawals.map((w) => (
                    <tr key={w.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td className="px-4 py-3 font-medium" style={{ color: COLORS.textPrimary, fontFamily: "'IBM Plex Mono', monospace" }}>{formatNaira(w.amount)}</td>
                      <td className="px-4 py-3" style={{ color: COLORS.textSecondary }}>{w.bankName}</td>
                      <td className="px-4 py-3" style={{ color: COLORS.textSecondary }}>{w.accountName}</td>
                      <td className="px-4 py-3"><Badge tone={STATUS_TONE[w.status]}>{w.status}</Badge></td>
                      <td className="px-4 py-3 text-xs" style={{ color: COLORS.textSecondary }}>{formatDate(w.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <InfiniteScrollSentinel sentinelRef={wdRef} hasMore={moreWithdrawals} />
            </div>
          )}
        </>
      )}

      {showWithdraw && <WithdrawModal baseUrl={baseUrl} opts={opts} balance={balance?.balance} onClose={() => setShowWithdraw(false)} onSaved={load} />}
    </div>
  )
}