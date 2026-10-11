import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { ana, authResponse } from './fakeApi'

// The real app (routes, guard, pages) in a router that lives in memory, starting at `path`.
// The API is the fake one from the tests, so nothing touches the network.
export function renderApp(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

// What the fake API knows. "me" only accepts ana's token, like the real one.
export const apiRoutes = {
  'GET /api/projects': { status: 200, body: [] },
  'GET /api/auth/me': ({ authorization }: { authorization: string | null }) =>
    authorization === 'Bearer token-for-ana' ? { status: 200, body: ana } : { status: 401 },
  'POST /api/auth/login': { status: 200, body: authResponse() },
  'POST /api/auth/register': { status: 201, body: authResponse() },
}

// Waits for a page title to show up
export const heading = (name: string) => screen.findByRole('heading', { name })

// Fills in the sign-in form and sends it
export async function fillSignIn() {
  fireEvent.change(await screen.findByLabelText('Email'), { target: { value: 'ana@test.local' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Sunflower7' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
}
