import { describe, expect, it } from 'vitest'
import { getRedirectTarget } from './redirect'

describe('getRedirectTarget', () => {
  it('goes to the page the person wanted', () => {
    expect(getRedirectTarget({ from: '/projects/4' })).toBe('/projects/4')
  })

  it('keeps the query string and the hash of that page', () => {
    expect(getRedirectTarget({ from: '/projects/4?status=Open&page=2#top' })).toBe(
      '/projects/4?status=Open&page=2#top',
    )
  })

  it.each([
    ['no state at all', null],
    ['an empty state', {}],
    ['a "from" that is not text', { from: 42 }],
    ['state that is not an object', 'hello'],
  ])('goes home when there is %s', (_name, state) => {
    expect(getRedirectTarget(state)).toBe('/')
  })

  it.each([
    ['another site', 'https://evil.example/steal'],
    ['a protocol-relative address, which also leaves the site', '//evil.example/steal'],
    ['a relative path', 'projects/4'],
  ])('never leaves the app: refuses %s', (_name, from) => {
    expect(getRedirectTarget({ from })).toBe('/')
  })

  it.each(['/login', '/login?x=1', '/register', '/register/'])(
    'never sends the person back to the sign-in pages: refuses %s',
    (from) => {
      expect(getRedirectTarget({ from })).toBe('/')
    },
  )

  it('does not mistake other pages that merely start with those letters', () => {
    expect(getRedirectTarget({ from: '/login-help' })).toBe('/login-help')
  })
})
