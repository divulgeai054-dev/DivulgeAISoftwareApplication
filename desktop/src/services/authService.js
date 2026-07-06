/**
 * authService.js — Desktop
 *
 * Auth flow:
 *  - If VITE_API_URL is set → calls real backend (same as website)
 *  - If no backend → uses a LOCAL user registry stored in desktop's own
 *    localStorage key 'divulgeai_desktop_users', separate from website.
 *    Doctor registers once on the website; to use dev mode on desktop,
 *    use the "Quick Dev Login" button which bypasses credential check.
 */

const BASE           = import.meta.env.VITE_API_URL || ''
const DESKTOP_USERS  = 'divulgeai_desktop_users'   // desktop-only registry
const WEBSITE_USERS  = 'divulgeai_users'            // website registry (same origin only)

function generateToken() { return 'tok_' + Math.random().toString(36).slice(2) + Date.now() }

function getDesktopUsers() {
  try { return JSON.parse(localStorage.getItem(DESKTOP_USERS)) || [] } catch { return [] }
}
function saveDesktopUsers(users) {
  localStorage.setItem(DESKTOP_USERS, JSON.stringify(users))
}

// Also try to read from website localStorage (only works if same origin)
function getWebsiteUsers() {
  try { return JSON.parse(localStorage.getItem(WEBSITE_USERS)) || [] } catch { return [] }
}

export async function loginUser({ email, password }) {
  // ── Real backend ────────────────────────────────────────────────────
  if (BASE) {
    const res  = await fetch(`${BASE}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Invalid email or password.')
    return data
  }

  // ── Dev / offline mode ──────────────────────────────────────────────
  // 1. Check desktop's own user registry first
  const desktopUsers = getDesktopUsers()
  const desktopMatch = desktopUsers.find(u => u.email === email && u.password === password)
  if (desktopMatch) {
    const { password: _pw, ...user } = desktopMatch
    return { user, token: generateToken() }
  }

  // 2. Check website registry (works when running website + desktop on same machine)
  const websiteUsers = getWebsiteUsers()
  const websiteMatch = websiteUsers.find(u => u.email === email && u.password === password)
  if (websiteMatch) {
    const { password: _pw, ...user } = websiteMatch
    // Cache in desktop registry so future logins work offline
    if (!desktopUsers.find(u => u.email === email)) {
      saveDesktopUsers([...desktopUsers, websiteMatch])
    }
    return { user, token: generateToken() }
  }

  throw new Error('invalid_credentials')
}

// Called by the "Quick Dev Login" button — no password check
export function devLogin(name = 'Dr. Demo Doctor', hospitalName = 'Demo Dental Clinic', email = 'doctor@demo.com') {
  const user = {
    id:             'dev_' + Date.now(),
    name,
    email,
    hospitalName,
    specialization: 'General Dentistry',
    phone:          '+91 98765 43210',
    role:           'dentist',
    plan:           'Professional',
  }
  const token = generateToken()
  // Save to desktop registry
  const users = getDesktopUsers()
  if (!users.find(u => u.email === email)) {
    saveDesktopUsers([...users, { ...user, password: 'demo' }])
  }
  return { user, token }
}

// Register directly from desktop (for offline dev)
export function registerDesktopUser(payload) {
  const users = getDesktopUsers()
  if (users.find(u => u.email === payload.email)) {
    throw new Error('An account with this email already exists.')
  }
  const user = {
    id:             'usr_' + Date.now(),
    name:           payload.name,
    email:          payload.email,
    hospitalName:   payload.hospitalName   || '',
    specialization: payload.specialization || '',
    phone:          payload.phone          || '',
    role:           'dentist',
    plan:           'Starter',
    joinedAt:       new Date().toISOString(),
  }
  saveDesktopUsers([...users, { ...user, password: payload.password }])
  return { user, token: generateToken() }
}
