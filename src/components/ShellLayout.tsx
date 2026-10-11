import { Outlet } from 'react-router'
import { AppShell } from './AppShell'

// The app's frame (sidebar, top bar) around whichever page the route picked
export function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
