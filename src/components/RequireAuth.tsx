import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { CheckingSession, SessionUnavailable } from './SessionScreens'

// The guard at the door of the app: pages put inside it only show to someone who is signed in.
// It is a "layout route": it shows its child page through <Outlet /> when the person may see it.
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <CheckingSession />
  }

  if (status === 'anonymous') {
    // Not signed in: go to the sign-in page, and remember where the person was heading
    // so they can be sent back after signing in. replace: Back shouldn't return to a page
    // that would just redirect again.
    const wantedPage = location.pathname + location.search + location.hash
    return <Navigate to="/login" replace state={{ from: wantedPage }} />
  }

  if (status === 'error') {
    return <SessionUnavailable />
  }

  return <Outlet />
}
