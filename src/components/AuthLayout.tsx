import { Navigate, Outlet, useLocation } from 'react-router'
import { getRedirectTarget } from '../auth/redirect'
import { useAuth } from '../auth/useAuth'
import { PixelIcon } from './PixelIcon'
import { CheckingSession } from './SessionScreens'

// The frame of the sign-in and sign-up pages: no sidebar (there is nothing to navigate yet),
// just the brand on top and the form in the middle, on the same pixel grid as the rest of the app
export function AuthLayout() {
  const { status } = useAuth()
  const location = useLocation()

  // A saved token is being checked: don't flash a sign-in form at someone who is signed in
  if (status === 'loading') {
    return <CheckingSession />
  }

  // Already signed in (or just signed in): these pages have nothing for them. Go where they
  // were heading, or home. Signing in uses the same rule, so both end up in the same place.
  if (status === 'authenticated') {
    return <Navigate to={getRedirectTarget(location.state)} replace />
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <PixelIcon name="bug" size={18} className="wordmark-icon" />
        <span className="wordmark-text">Playtest</span>
        <span className="wordmark-tag">qa</span>
      </div>

      <main className="auth-column">
        <Outlet />
      </main>

      <footer className="auth-footer">playtest-tracker</footer>
    </div>
  )
}
