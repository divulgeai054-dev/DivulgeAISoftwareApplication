/**
 * helpers.js – Shared utility functions used across the app.
 */

// ── String helpers ────────────────────────────────────────────────────────────

/** Return initials from a full name (max 2 chars). */
export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('')
}

/** Capitalise the first letter of each word. */
export function titleCase(str = '') {
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

/** Truncate a string to maxLength, appending "…" if needed. */
export function truncate(str = '', maxLength = 80) {
  return str.length > maxLength ? str.slice(0, maxLength - 1) + '…' : str
}

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Format an ISO date string to a readable locale string. */
export function formatDate(iso, locale = 'en-IN', opts = {}) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit', month: 'short', year: 'numeric', ...opts,
  })
}

/** Format an ISO datetime string. */
export function formatDateTime(iso, locale = 'en-IN') {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(locale, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

/** Return an array of calendar days for a given year/month (0-indexed). */
export function getCalendarDays(year, month) {
  const firstDay  = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  return { firstDay, totalDays }
}

export const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export const DAY_NAMES_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// ── File helpers ──────────────────────────────────────────────────────────────

/** Convert a File object to a base64 string (no data-URI prefix). */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Return the MIME type string from a File. */
export function getMediaType(file) {
  return file.type || 'image/jpeg'
}

/** Human-readable file size. */
export function formatFileSize(bytes) {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Validation helpers ────────────────────────────────────────────────────────

export function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function isValidPhone(phone = '') {
  return /^[+\d\s\-()]{7,15}$/.test(phone.trim())
}

/** Validate a registration form. Returns an errors object. */
export function validateRegister({ name, email, password, confirm }) {
  const errors = {}
  if (!name.trim())             errors.name     = 'Full name is required.'
  if (!isValidEmail(email))     errors.email    = 'Please enter a valid email address.'
  if (password.length < 6)      errors.password = 'Password must be at least 6 characters.'
  if (password !== confirm)     errors.confirm  = 'Passwords do not match.'
  return errors
}

/** Validate a login form. Returns an errors object. */
export function validateLogin({ email, password }) {
  const errors = {}
  if (!isValidEmail(email)) errors.email    = 'Please enter a valid email address.'
  if (!password)            errors.password = 'Password is required.'
  return errors
}

// ── Colour helpers ────────────────────────────────────────────────────────────

export const SEVERITY_COLOR = {
  Severe:   '#ef4444',
  Moderate: '#f59e0b',
  Mild:     '#10b981',
  Healthy:  '#0d9488',
}

export const SEVERITY_BG = {
  Severe:   '#fef2f2',
  Moderate: '#fffbeb',
  Mild:     '#ecfdf5',
  Healthy:  '#f0fdfa',
}

export const RISK_COLOR = {
  High:     '#ef4444',
  Moderate: '#f59e0b',
  Low:      '#10b981',
}

export const URGENCY_COLOR = {
  Immediate:       '#ef4444',
  'Within 2 weeks':'#f59e0b',
  Routine:         '#64748b',
  Monitor:         '#0d9488',
}

// ── Report download ───────────────────────────────────────────────────────────

/** Generate and download a plain-text clinical report. */
export function downloadReportTxt(report, user = {}) {
  const hr  = '─'.repeat(52)
  const sep = '─'.repeat(30)

  const lines = [
    'DIVULGEAI CLINICAL REPORT',
    hr,
    `Generated : ${formatDateTime(new Date().toISOString())}`,
    `Clinician : ${user.name  || '—'}`,
    `Clinic    : ${user.clinic || '—'}`,
    `Report ID : ${report.id  || '—'}`,
    '',
    'SCAN SUMMARY',
    sep,
    `Image Type    : ${report.imageType    || '—'}`,
    `Image Quality : ${report.imageQuality || '—'}`,
    `Teeth Analyzed: ${report.teethAnalyzed ?? '—'}`,
    `Bone Level    : ${report.boneLevel    || '—'}`,
    `Overall Risk  : ${report.overallRisk  || '—'}`,
    `Urgency       : ${report.urgency      || '—'}`,
    `Note          : ${report.patientNote  || '—'}`,
    '',
    'FINDINGS',
    sep,
    ...(report.findings || []).flatMap(f => [
      `Tooth FDI ${f.tooth} — ${f.severity} Caries (${f.surface} surface)`,
      `  Confidence    : ${f.confidence}%`,
      `  Description   : ${f.description}`,
      `  Recommendation: ${f.recommendation}`,
      '',
    ]),
    'OVERALL ASSESSMENT',
    sep,
    report.summaryNote || '—',
    '',
    hr,
    'DivulgeAI | AI-Assisted Dental Diagnostics',
    'For clinical support only. Not a substitute for professional judgment.',
  ]

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `DivulgeAI_Report_${report.id || Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
