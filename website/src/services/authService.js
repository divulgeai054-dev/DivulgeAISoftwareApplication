const BASE      = import.meta.env.VITE_API_URL || ''
const USERS_KEY = 'divulgeai_users'

async function request(path, options = {}) {
  const token = localStorage.getItem('divulgeai_token')
  const res   = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}), ...options.headers },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`)
  return data
}

function getStoredUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || [] } catch { return [] } }
function saveStoredUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)) }
function generateToken()   { return 'tok_' + Math.random().toString(36).slice(2) + Date.now() }

export async function registerUser(payload) {
  if (BASE) return request('/api/auth/register', { method:'POST', body:JSON.stringify(payload) })
  const users = getStoredUsers()
  if (users.find(u => u.email === payload.email)) throw new Error('An account with this email already exists.')
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
  saveStoredUsers([...users, { ...user, password: payload.password }])
  return { user, token: generateToken() }
}

export async function loginUser(payload) {
  if (BASE) return request('/api/auth/login', { method:'POST', body:JSON.stringify(payload) })
  const users = getStoredUsers()
  const match = users.find(u => u.email === payload.email && u.password === payload.password)
  if (!match) throw new Error('Invalid email or password.')
  const { password: _pw, ...user } = match
  return { user, token: generateToken() }
}

export async function getMe() {
  if (BASE) return request('/api/auth/me')
  const raw = localStorage.getItem('divulgeai_user')
  if (!raw) throw new Error('Not authenticated')
  return { user: JSON.parse(raw) }
}

export async function logoutUser() {
  if (BASE) { try { await request('/api/auth/logout', { method:'POST' }) } catch {} }
}

export async function forgotPassword(payload) {
  if (BASE) return request('/api/auth/forgot-password', { method:'POST', body:JSON.stringify(payload) })
  return { message:'Password reset link sent.' }
}
