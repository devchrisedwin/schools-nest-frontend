// ============================================================
// [SCHOOL ADMIN PORTAL] — Academic Setup
// Manages one school's own sessions, terms, classes, arms,
// subjects, CA config, and grading scale. Not used by Super Admin.
// ============================================================
import React, { useState } from 'react'
import { COLORS } from '../../theme'
import SessionsTerms from './SessionsTerms'
import ClassesArms from './ClassesArms'
import Subjects from './Subjects'
import GradingConfig from './GradingConfig'

const TABS = [
  { key: 'sessions', label: 'Sessions & Terms' },
  { key: 'classes', label: 'Classes & Arms' },
  { key: 'subjects', label: 'Subjects' },
  { key: 'grading', label: 'CA & Grading' },
]

export default function AcademicSetup({ baseUrl, token, subdomain }) {
  const [tab, setTab] = useState('sessions')

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: COLORS.border }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-medium -mb-px transition-colors"
            style={{
              borderBottom: tab === t.key ? `2px solid ${COLORS.navyAccent}` : '2px solid transparent',
              color: tab === t.key ? COLORS.navyAccent : COLORS.textSecondary,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sessions' && <SessionsTerms baseUrl={baseUrl} token={token} subdomain={subdomain} />}
      {tab === 'classes' && <ClassesArms baseUrl={baseUrl} token={token} subdomain={subdomain} />}
      {tab === 'subjects' && <Subjects baseUrl={baseUrl} token={token} subdomain={subdomain} />}
      {tab === 'grading' && <GradingConfig baseUrl={baseUrl} token={token} subdomain={subdomain} />}
    </div>
  )
}