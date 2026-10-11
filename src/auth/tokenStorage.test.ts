import { describe, expect, it, vi } from 'vitest'
import { clearToken, getToken, setToken } from './tokenStorage'

describe('tokenStorage', () => {
  it('has no token until one is saved', () => {
    expect(getToken()).toBeNull()
  })

  it('saves a token and reads it back', () => {
    setToken('abc.def.ghi')

    expect(getToken()).toBe('abc.def.ghi')
  })

  it('clears the token', () => {
    setToken('abc.def.ghi')

    clearToken()

    expect(getToken()).toBeNull()
  })

  it('keeps working when the browser refuses to give access to localStorage', () => {
    // Private windows and blocked site data make every localStorage call throw
    const blocked = () => {
      throw new Error('blocked')
    }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked)

    expect(getToken()).toBeNull()
    expect(() => setToken('abc.def.ghi')).not.toThrow()
    expect(() => clearToken()).not.toThrow()
  })
})
