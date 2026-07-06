const BASE = import.meta.env.VITE_API_URL || ''

const hdrs = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

const req = async (path, opts = {}, token) => {
  if (!BASE) return null   // use local state in dev
  const res  = await fetch(`${BASE}${path}`, { ...opts, headers: { ...hdrs(token), ...opts.headers } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

export const getPatients    = (token)        => req('/api/patients',         {},                                           token)
export const createPatient  = (data, token)  => req('/api/patients',         { method:'POST', body:JSON.stringify(data) }, token)
export const updatePatient  = (id, d, token) => req(`/api/patients/${id}`,   { method:'PUT',  body:JSON.stringify(d) },    token)
export const deletePatient  = (id, token)    => req(`/api/patients/${id}`,   { method:'DELETE' },                          token)
export const getReports     = (token)        => req('/api/reports',           {},                                           token)
export const updateReport   = (id, d, token) => req(`/api/reports/${id}`,    { method:'PUT',  body:JSON.stringify(d) },    token)
export const saveReport     = (data, token)  => req('/api/reports',           { method:'POST', body:JSON.stringify(data) }, token)
