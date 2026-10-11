// The organization the person was last working in, so the app opens there next time.
// It is only a convenience: if it can't be saved or read (private windows, blocked site data),
// the app just opens the first organization. Every access is wrapped in try/catch for that.
//
// It is not secret and not trusted: whoever uses it checks that the person still belongs to
// that organization (another account may have used this browser).

const key = 'playtest.organization'

export function getLastOrganizationId(): number | null {
  try {
    const saved = localStorage.getItem(key)
    if (saved === null) return null

    const id = Number(saved)
    return Number.isInteger(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

export function setLastOrganizationId(id: number): void {
  try {
    localStorage.setItem(key, String(id))
  } catch {
    // Nowhere to keep it: the app will open the first organization next time
  }
}
