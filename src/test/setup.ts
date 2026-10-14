import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// The browser's own <dialog> methods aren't in jsdom. These do what they do: open and close it
// (and announce the closing, like the browser does). The confirmation dialogs rely on them.
HTMLDialogElement.prototype.showModal = function showModal() {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close = function close() {
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
}

// Runs after every test, so one test can't leave anything behind for the next
afterEach(() => {
  cleanup() // removes the components a test rendered
  localStorage.clear() // the saved login token
  vi.unstubAllGlobals() // puts the real fetch back
  vi.restoreAllMocks()
})
