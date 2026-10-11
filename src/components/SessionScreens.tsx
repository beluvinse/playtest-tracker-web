import type { ReactNode } from 'react'
import { useAuth } from '../auth/useAuth'
import { ErrorMessage } from './ErrorMessage'

// Full-window screens shown while the app can't yet say whether the person is signed in.
// They use the sign-in frame so nothing jumps around when the real page replaces them.

function FullWindow({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page">
      <main className="auth-column">{children}</main>
    </div>
  )
}

// A saved token is being checked with the API (a moment, usually)
export function CheckingSession() {
  return (
    <FullWindow>
      <p className="muted" role="status">
        Checking your session…
      </p>
    </FullWindow>
  )
}

// There is a saved token but the API can't be reached, so we can't tell if it's still good.
// The session is kept (the token may be fine): the person can try again once the API is back.
export function SessionUnavailable() {
  const { error, retry, logout } = useAuth()

  return (
    <FullWindow>
      <h1 className="press-start-title">Can't connect</h1>
      <ErrorMessage error={error} />
      <div className="form-actions">
        <button type="button" className="button-primary" onClick={retry}>
          Try again
        </button>
        <button type="button" className="button-ghost" onClick={logout}>
          Sign out
        </button>
      </div>
    </FullWindow>
  )
}
