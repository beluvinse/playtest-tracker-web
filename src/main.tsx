import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiError } from './api/client'
import './index.css'
import App from './App.tsx'

// Caches API responses and refetches them when they change (loading and error states included)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry network and server (5xx) errors up to 3 times, but not 4xx: a 404 or a 400
      // will give the same answer again, so retrying only makes the screen wait longer
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 3,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
