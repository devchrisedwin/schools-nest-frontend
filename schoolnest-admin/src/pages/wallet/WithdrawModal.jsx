// ============================================================
// [SCHOOL ADMIN PORTAL] — Withdraw Modal
// Bank select → account number → auto-resolved account name →
// confirm amount. Account name comes back from Paystack, never
// typed manually — matches the "auto give account holder's name" ask.
// ============================================================
import React, { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { COLORS, formatNaira } from '../../theme'
import { apiFetch } from '../../api'
import { Button, ErrorBanner, Field, Input, Select } from '../../components/ui'
import Modal from '../../components/Modal'

export default function WithdrawModal({ baseUrl, opts, balance, onClose, onSaved }) {
  const [banks, setBanks] = useState([])
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [resolvedName, setResolvedName] = useState('')
  const [amount, setAmount] = useState('')
  const [resolving, setResolving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch(baseUrl, '/wallet/banks', opts).then(setBanks).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    setResolvedName('')
    if (accountNumber.length !== 10 || !bankCode) return
    setResolving(true); setError('')
    apiFetch(baseUrl, '/wallet/resolve-account', { ...opts, method: 'POST', body: { accountNumber, bankCode } })
      .then((d) => setResolvedName(d.account_name))
      .catch((e) => setError(e.message))
      .finally(() => setResolving(false))
  }, [accountNumber, bankCode])

  async function submit(e) {
    e.preventDefault()
    if (!resolvedName) { setError('Resolve the account first.'); return }
    if (Number(amount) > balance) { setError('Amount exceeds available balance.'); return }
    setSubmitting(true); setError('')
    try {
      const bank = banks.find((b) => b.code === bankCode)
      await apiFetch(baseUrl, '/wallet/withdraw', { ...opts, method: 'POST', body: { amount: Number(amount), accountNumber, bankCode, bankName: bank?.name } })
      onSaved(); onClose()
    } catch (err) { setError(err.message) } finally { setSubmitting(false) }
  }

  return (
    <Modal title="Withdraw funds" onClose={onClose}>
      <ErrorBanner message={error} />
      <p className="text-xs mb-4" style={{ color: COLORS.textSecondary }}>Available: <strong style={{ color: COLORS.textPrimary }}>{formatNaira(balance)}</strong></p>
      <form onSubmit={submit}>
        <Field label="Bank">
          <Select value={bankCode} onChange={(e) => setBankCode(e.target.value)} required>
            <option value="">Select bank…</option>
            {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
          </Select>
        </Field>
        <Field label="Account number">
          <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} required />
        </Field>
        {resolving && <p className="text-xs mb-3" style={{ color: COLORS.textSecondary }}>Verifying account…</p>}
        {resolvedName && (
          <div className="rounded px-3 py-2.5 mb-4 flex items-center gap-2 text-sm" style={{ backgroundColor: '#E8F5EE', color: COLORS.green }}>
            <CheckCircle2 size={14} /> {resolvedName}
          </div>
        )}
        <Field label="Amount (₦)"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required /></Field>
        <Button type="submit" full variant="green" loading={submitting} disabled={!resolvedName}>Withdraw</Button>
      </form>
    </Modal>
  )
}