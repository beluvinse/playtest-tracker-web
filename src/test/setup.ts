import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Runs after every test, so one test can't leave anything behind for the next
afterEach(() => {
  cleanup() // removes the components a test rendered
  localStorage.clear() // the saved login token
  vi.unstubAllGlobals() // puts the real fetch back
  vi.restoreAllMocks()
})
