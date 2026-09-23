// ============================================================
// [SHARED — used by both School Admin and Super Admin portals]
// Generic modal shell for forms.
// ============================================================
import React from 'react'
import { X } from 'lucide-react'
import { COLORS } from '../theme'

export default function Modal({ title, onClose, children, width = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(11,21,38,0.5)' }}>
      <div className={`bg-white rounded-lg w-full ${width} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 bg-white" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <h2 className="text-base font-semibold" style={{ color: COLORS.textPrimary }}>{title}</h2>
          <button onClick={onClose}><X size={18} style={{ color: COLORS.textSecondary }} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}