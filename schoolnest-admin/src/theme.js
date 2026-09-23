// Deep navy is the institutional anchor; red/green are the status language
// used throughout — not decoration, they mean "needs attention" / "good".
export const COLORS = {
  navyDeep: '#0B1526',
  navyMid: '#12203B',
  navyLine: '#22355A',
  navyAccent: '#1B3A6B',
  navyAccentHover: '#234A86',
  red: '#B3261E',
  redHover: '#96201A',
  green: '#1B7A4F',
  greenHover: '#166341',
  amber: '#B7791F',
  surface: '#F5F6F8',
  card: '#FFFFFF',
  border: '#E3E6EC',
  textPrimary: '#101826',
  textSecondary: '#5B6472',
  textOnNavy: '#C7D0E0',
  textOnNavyMuted: '#7C8AA6',
}

export function formatNaira(amount) {
  const n = Number(amount || 0)
  return '₦' + n.toLocaleString('en-NG', { maximumFractionDigits: 0 })
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Decodes the JWT payload client-side (no verification needed — it's our own
// freshly-issued token) just to read schoolId/role/userId without a library.
export function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}