// ============================================================
// [SCHOOL ADMIN PORTAL] — Referrals card, rendered inside Billing
// Shareable referral code, pending rewards with claim actions,
// and a list of schools this school has referred so far.
// ============================================================
import React, { useState, useEffect } from 'react'
import { Gift, Copy, Check, Wallet, Receipt, Building2 } from 'lucide-react'
import { COLORS, formatNaira, formatDate } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Badge, Spinner, ErrorBanner, EmptyState } from '../../components/ui'
import ConfirmModal from '../../components/ConfirmModal'

export default function ReferralsCard({ baseUrl, token, subdomain }) {
  const opts = { token, subdomain }
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [confirmClaim, setConfirmClaim] = useState(null) // { rewardId, type: 'cash'|'subscription' }
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true); setError('')
    try { setInfo(await apiFetch(baseUrl, '/referrals/me', opts)) }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [baseUrl, token, subdomain])

  function copyCode() {
    navigator.clipboard.writeText(info.referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function confirmClaimNow() {
    const { rewardId, type } = confirmClaim
    setConfirmClaim(null); setBusy(true)
    try {
      const endpoint = type === 'cash' ? 'claim-cash' : 'claim-subscription'
      await apiFetch(baseUrl, `/referrals/${rewardId}/${endpoint}`, { ...opts, method: 'POST' })
      await load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  if (loading) return <Spinner label="Loading referrals…" />
  if (!info) return null

  return (
    <div className="bg-white rounded p-5" style={{ border: `1px solid ${COLORS.border}` }}>
      <ErrorBanner message={error} />

      <div className="flex items-center gap-2 mb-1">
        <Gift size={16} style={{ color: COLORS.navyAccent }} />
        <h3 className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>Refer a school, earn a reward</h3>
      </div>
      <p className="text-xs mb-4" style={{ color: COLORS.textSecondary }}>
        Share your code below. When a school you refer reaches 30+ students and makes their first payment, you earn a reward.
      </p>

      <div className="flex items-center gap-2 mb-5">
        <div className="flex-1 px-3 py-2.5 rounded text-sm" style={{ backgroundColor: COLORS.surface, fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textPrimary, border: `1px solid ${COLORS.border}` }}>
          {info.referralCode}
        </div>
        <Button size="sm" variant="ghost" onClick={copyCode}>
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      {info.totalEarned > 0 && (
        <div className="rounded px-4 py-3 mb-5" style={{ backgroundColor: '#E8F5EE' }}>
          <div className="text-xs mb-0.5" style={{ color: COLORS.textSecondary }}>Total earned so far</div>
          <div className="text-lg font-semibold" style={{ color: COLORS.green, fontFamily: "'IBM Plex Mono', monospace" }}>{formatNaira(info.totalEarned)}</div>
        </div>
      )}

      {info.pendingRewards.length > 0 && (
        <div className="mb-5">
          <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.textSecondary }}>Ready to claim</div>
          <div className="space-y-2">
            {info.pendingRewards.map((r) => (
              <div key={r.id} className="rounded p-3.5" style={{ border: `1px solid ${COLORS.border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary, fontFamily: "'IBM Plex Mono', monospace" }}>{formatNaira(r.amount)}</span>
                  <Badge tone="amber">Pending</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="green" onClick={() => setConfirmClaim({ rewardId: r.id, type: 'cash' })} disabled={busy}>
                    <Wallet size={13} /> Convert to cash
                  </Button>
                  <Button size="sm" variant="navy" onClick={() => setConfirmClaim({ rewardId: r.id, type: 'subscription' })} disabled={busy}>
                    <Receipt size={13} /> Apply to subscription
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {info.claimedRewards.length > 0 && (
        <div className="mb-5">
          <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.textSecondary }}>Claimed</div>
          <div className="space-y-1.5">
            {info.claimedRewards.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs py-1.5" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ color: COLORS.textSecondary }}>
                  {r.status === 'claimed_cash' ? 'Converted to wallet cash' : 'Applied to subscription'} · {formatDate(r.claimedAt)}
                </span>
                <span style={{ color: COLORS.textPrimary, fontFamily: "'IBM Plex Mono', monospace" }}>{formatNaira(r.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.textSecondary }}>Schools you've referred</div>
        {info.referredSchools.length === 0 && (
          <EmptyState icon={Building2} title="No referrals yet" sub="Share your code above to start earning." />
        )}
        {info.referredSchools.map((s) => (
          <div key={s.id} className="flex items-center justify-between text-sm py-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <span style={{ color: COLORS.textPrimary }}>{s.name}</span>
            <span className="text-xs" style={{ color: COLORS.textSecondary }}>Joined {formatDate(s.createdAt)}</span>
          </div>
        ))}
      </div>

      {confirmClaim && (
        <ConfirmModal
          title={confirmClaim.type === 'cash' ? 'Convert reward to cash' : 'Apply reward to subscription'}
          message={confirmClaim.type === 'cash'
            ? 'This reward will be added to your wallet balance, available to withdraw.'
            : 'This reward will be applied as a discount to your next unpaid invoice. If you have no unpaid invoice yet, it will stay available until one is generated.'}
          confirmLabel="Confirm"
          tone="navy"
          loading={busy}
          onCancel={() => setConfirmClaim(null)}
          onConfirm={confirmClaimNow}
        />
      )}
    </div>
  )
}