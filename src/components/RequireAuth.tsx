import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { CheckingSession, SessionUnavailable } from './SessionScreens'

// The guard at the door of the app: pages put inside it only show to someone who is signed in.
// It is a "layout route": it shows its child page through <Outlet /> when the person may see it.
export function RequireAuth() {
  const { status, sessionEnd } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <CheckingSession />
  }

  if (status === 'anonymous') {
    // Not signed in: go to the sign-in page, and remember where the person was heading
    // so they can be sent back after signing in. replace: Back shouldn't return to a page
    // that would just redirect again.
    //
    // Except after the person chose to sign out: the page they were on is theirs, not the
    // next person's. (An expired session is different: they want to carry on where they were.)
    const wantedPage = location.pathname + location.search + location.hash
    const state = sessionEnd === 'signed-out' ? undefined : { from: wantedPage }
    return <Navigate to="/login" replace state={state} />
  }

  if (status === 'error') {
    return <SessionUnavailable />
  }

  return <Outlet />
}
