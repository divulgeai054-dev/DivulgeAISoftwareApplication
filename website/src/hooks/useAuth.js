import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

/**
 * useAuth – consume the AuthContext anywhere in the component tree.
 *
 * Returns:
 *   user            – current user object or null
 *   token           – JWT / session token or null
 *   loading         – true while hydrating from localStorage
 *   isAuthenticated – boolean convenience flag
 *   login(user, token) – persist session
 *   logout()           – clear session
 *   updateUser(patch)  – merge patch into current user
 */
export default function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
