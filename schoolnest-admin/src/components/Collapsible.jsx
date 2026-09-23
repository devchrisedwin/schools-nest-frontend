import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { COLORS } from '../theme'

export default function Collapsible({ title, subtitle, defaultOpen = false, headerRight, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded" style={{ border: `1px solid ${COLORS.border}` }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: open ? `1px solid ${COLORS.border}` : 'none' }}>
        <div className="flex items-center gap-2.5">
          {open ? <ChevronDown size={16} style={{ color: COLORS.textSecondary }} /> : <ChevronRight size={16} style={{ color: COLORS.textSecondary }} />}
          <div className="text-left">
            <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>{title}</span>
            {subtitle && <span className="text-xs ml-2" style={{ color: COLORS.textSecondary }}>{subtitle}</span>}
          </div>
        </div>
        {headerRight && <div onClick={(e) => e.stopPropagation()}>{headerRight}</div>}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  )
}