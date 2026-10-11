// When someone who isn't signed in opens a page (say /bugs/7), they are sent to /login and
// the page they wanted travels along as "from" in the router's location state. After signing
// in they go back there. This turns that state into a safe place to go.

interface RedirectState {
  from?: unknown
}

export function getRedirectTarget(state: unknown): string {
  const from = (state as RedirectState | null)?.from

  if (typeof from !== 'string') return '/'

  // Only places inside this app: one leading "/" ("//evil.example" would leave the site)
  if (!from.startsWith('/') || from.startsWith('//')) return '/'

  // Never "go back" to the sign-in or sign-up pages themselves
  if (/^\/(login|register)(\/|\?|#|$)/.test(from)) return '/'

  return from
}
