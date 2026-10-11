import { Outlet } from 'react-router'
import { PixelIcon } from './PixelIcon'

// The frame of the sign-in and sign-up pages: no sidebar (there is nothing to navigate yet),
// just the brand on top and the form in the middle, on the same pixel grid as the rest of the app
export function AuthLayout() {
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
