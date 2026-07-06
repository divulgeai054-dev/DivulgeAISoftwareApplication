import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const AUTH_KEY  = 'divulgeai_user'
const TOKEN_KEY = 'divulgeai_token'

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const u = localStorage.getItem(AUTH_KEY)
      const t = localStorage.getItem(TOKEN_KEY)
      if (u && t) { setUser(JSON.parse(u)); setToken(t) }
    } catch { localStorage.removeItem(AUTH_KEY); localStorage.removeItem(TOKEN_KEY) }
    finally { setLoading(false) }
  }, [])

  const login = useCallback((userData, authToken) => {
    setUser(userData); setToken(authToken)
    localStorage.setItem(AUTH_KEY,  JSON.stringify(userData))
    localStorage.setItem(TOKEN_KEY, authToken)
  }, [])

  const logout = useCallback(() => {
    setUser(null); setToken(null)
    localStorage.removeItem(AUTH_KEY); localStorage.removeItem(TOKEN_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated: !!user && !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
