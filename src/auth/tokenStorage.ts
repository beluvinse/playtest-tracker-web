// Where the login token is kept between visits, so reloading the page doesn't log you out.
//
// localStorage is simple, but any script running on the page can read it. That is the trade-off
// we accepted for now (the safer option, an HttpOnly cookie, is a possible later hardening step).
// Every access is wrapped in try/catch: some browsers refuse localStorage (private windows,
// blocked site data), and then the app must still work, just without remembering the login.

const key = 'playtest.token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(key, token)
  } catch {
    // Nowhere to keep it: the session will last until the page is closed
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Nothing to remove
  }
}

// The name of the storage entry. Other tabs of the same app announce changes to it
// (login in one tab, logout in another) through the browser's "storage" event.
export const tokenStorageKey = key
