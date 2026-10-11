import { describe, expect, it } from 'vitest'
import { organization } from '../test/fakeApi'
import { pickOrganization, resolveOrganizationId } from './pickOrganization'

describe('pickOrganization', () => {
  const personal = organization({ id: 1, name: "Ana's space" })
  const studio = organization({ id: 2, name: 'Night Owls' })
  const demo = organization({ id: 3, name: 'Demo', isDemo: true })
  const all = [personal, studio, demo]

  it('opens the last one the person used, when they still belong to it', () => {
    expect(pickOrganization(all, 2)).toBe(studio)
  })

  it('opens the first one (their personal one) when there is no last one', () => {
    expect(pickOrganization(all, null)).toBe(personal)
  })

  it('ignores a last one that is no longer theirs (another account used this browser)', () => {
    expect(pickOrganization(all, 99)).toBe(personal)
  })

  it('has nothing to open when the person belongs to none', () => {
    expect(pickOrganization([], 2)).toBeUndefined()
  })
})

describe('resolveOrganizationId', () => {
  const none = { fromAddress: undefined, insideAProject: false, ofTheProject: undefined, lastUsed: null }

  it('takes the one in the address when there is one', () => {
    expect(resolveOrganizationId({ ...none, fromAddress: 4, lastUsed: 7 })).toBe(4)
  })

  it('inside a project, it is the organization of that project', () => {
    expect(resolveOrganizationId({ ...none, insideAProject: true, ofTheProject: 5, lastUsed: 7 })).toBe(5)
  })

  it('inside a project that is still loading, it is not the last one used: better none than the wrong one', () => {
    expect(resolveOrganizationId({ ...none, insideAProject: true, ofTheProject: undefined, lastUsed: 7 })).toBeUndefined()
  })

  it('anywhere else, it is the last one used', () => {
    expect(resolveOrganizationId({ ...none, lastUsed: 7 })).toBe(7)
  })

  it('is unknown when there is nothing to go by', () => {
    expect(resolveOrganizationId(none)).toBeUndefined()
  })
})
