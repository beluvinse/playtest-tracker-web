import { useContext } from 'react'
import { AuthContext } from './AuthContext'

// The session, from any component: const { status, user, login, logout } = useAuth()
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }

  return context
}
