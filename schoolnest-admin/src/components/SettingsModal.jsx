import React, { useState } from 'react'
import { X } from 'lucide-react'
import { COLORS } from '../theme'
import { Button } from './ui'

export default function SettingsModal({ baseUrl, onSave, onClose }) {
  const [value, setValue] = useState(baseUrl)
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(11,21,38,0.5)' }}>
      <div className="bg-white rounded w-full max-w-md p-6" style={{ border: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: COLORS.textPrimary }}>API connection</h2>
          <button onClick={onClose}><X size={18} style={{ color: COLORS.textSecondary }} /></button>
        </div>
        <label className="text-xs font-medium block mb-1.5" style={{ color: COLORS.textSecondary }}>API base URL</label>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full px-3 py-2 rounded text-sm mb-4"
          style={{ border: `1px solid ${COLORS.border}`, fontFamily: "'IBM Plex Mono', monospace" }}
        />
        <Button full onClick={() => { onSave(value); onClose() }}>Save</Button>
      </div>
      <p className="text-xs mb-3" style={{ color: COLORS.textSecondary }}>For developers only — most schools won't need to change this.</p>
    </div>
  )
}