import { createContext, useState, useEffect, useCallback } from 'react'

export const AuthContext = createContext(null)

const AUTH_KEY = 'divulgeai_user'
const TOKEN_KEY = 'divulgeai_token'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)   // true while hydrating from storage

  // ── Hydrate from localStorage on mount ──────────────────────────
  useEffect(() => {
    try {
      const storedUser  = localStorage.getItem(AUTH_KEY)
      const storedToken = localStorage.getItem(TOKEN_KEY)
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser))
        setToken(storedToken)
      }
    } catch {
      localStorage.removeItem(AUTH_KEY)
      localStorage.removeItem(TOKEN_KEY)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Persist to localStorage whenever user/token changes ─────────
  useEffect(() => {
    if (user && token) {
      localStorage.setItem(AUTH_KEY,  JSON.stringify(user))
      localStorage.setItem(TOKEN_KEY, token)
    }
  }, [user, token])

  // ── Actions ──────────────────────────────────────────────────────
  const login = useCallback((userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem(AUTH_KEY,  JSON.stringify(userData))
    localStorage.setItem(TOKEN_KEY, authToken)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(TOKEN_KEY)
  }, [])

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates }
      localStorage.setItem(AUTH_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
