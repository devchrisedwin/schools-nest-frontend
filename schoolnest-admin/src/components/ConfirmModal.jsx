// [SHARED] — the one confirm dialog used everywhere instead of window.confirm
import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { COLORS } from '../theme'
import { Button } from './ui'

export default function ConfirmModal({ title = 'Are you sure?', message, confirmLabel = 'Confirm', tone = 'red', onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(11,21,38,0.5)' }}>
      <div className="bg-white rounded-lg w-full max-w-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: tone === 'red' ? '#FBEAEA' : '#E8F5EE' }}>
            <AlertTriangle size={16} style={{ color: tone === 'red' ? COLORS.red : COLORS.green }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: COLORS.textPrimary }}>{title}</h3>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}