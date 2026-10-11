import { useRef } from 'react'
import { useAuth } from '../auth/useAuth'
import { useDismiss } from '../hooks/useDismiss'
import { UserAvatar } from './UserAvatar'

// The person's avatar in the top bar. It opens a small menu with who they are and "Sign out".
// Like the other menus, it is a <details>, closed by Escape or by a click outside it.
export function UserMenu() {
  const { user, logout } = useAuth()
  const detailsRef = useRef<HTMLDetailsElement>(null)
  useDismiss(detailsRef)

  if (user === null) return null

  return (
    <details className="user-menu" ref={detailsRef}>
      <summary className="user-menu-button">
        <UserAvatar userId={user.id} />
        <span className="visually-hidden">Account menu for {user.displayName}</span>
      </summary>

      <div className="user-menu-list">
        <div className="user-menu-who">
          <strong>{user.displayName}</strong>
          <span className="muted">{user.email}</span>
        </div>
        <div className="scanline" aria-hidden="true" />
        {/* No navigation here: signing out makes the page guard send the person to /login */}
        <button type="button" className="status-option" onClick={logout}>
          Sign out
        </button>
      </div>
    </details>
  )
}
