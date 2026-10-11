import { afterEach, describe, expect, it, vi } from 'vitest'
import { getLastOrganizationId, setLastOrganizationId } from './lastOrganization'

describe('the last organization used', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('is nothing until one is saved', () => {
    expect(getLastOrganizationId()).toBeNull()
  })

  it('is what was saved', () => {
    setLastOrganizationId(4)

    expect(getLastOrganizationId()).toBe(4)
  })

  it('is replaced by the next one', () => {
    setLastOrganizationId(4)
    setLastOrganizationId(9)

    expect(getLastOrganizationId()).toBe(9)
  })

  it.each(['abc', '0', '-3', '2.5', ''])('ignores a saved value that is not an id (%j)', (saved) => {
    localStorage.setItem('playtest.organization', saved)

    expect(getLastOrganizationId()).toBeNull()
  })

  it('does not break when the browser refuses to save or read', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(() => setLastOrganizationId(4)).not.toThrow()
    expect(getLastOrganizationId()).toBeNull()
  })
})
