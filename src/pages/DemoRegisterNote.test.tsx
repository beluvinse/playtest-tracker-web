import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { demoInfo, installFakeApi } from '../test/fakeApi'
import { apiRoutes, heading, renderApp } from '../test/renderApp'

describe('the note about the example organization on the sign-up page', () => {
  it('tells that signing up also means joining it, and names it', async () => {
    installFakeApi({ ...apiRoutes, 'GET /api/demo': { status: 200, body: demoInfo() } })

    renderApp('/register')
    await heading('New player')

    const note = await screen.findByText(/You will also join/)
    expect(note.textContent).toContain('Pink in the Night Studio')
  })

  it('says what that means: it is shared, and it cannot be left', async () => {
    installFakeApi({ ...apiRoutes, 'GET /api/demo': { status: 200, body: demoInfo() } })

    renderApp('/register')
    await heading('New player')

    const note = await screen.findByText(/You will also join/)
    expect(note.textContent).toMatch(/shared with the others/)
    expect(note.textContent).toMatch(/can't leave it/)
    expect(note.textContent).toMatch(/Your own organization is created for you too/)
  })

  it('uses the name the API gives, not a fixed one', async () => {
    installFakeApi({
      ...apiRoutes,
      'GET /api/demo': { status: 200, body: demoInfo({ organizationName: 'Some Other Studio' }) },
    })

    renderApp('/register')
    await heading('New player')

    const note = await screen.findByText(/You will also join/)
    expect(note.textContent).toContain('Some Other Studio')
    expect(note.textContent).not.toContain('Pink in the Night')
  })

  it('says nothing when there is no demo', async () => {
    installFakeApi({ ...apiRoutes, 'GET /api/demo': { status: 404 } })

    renderApp('/register')
    await heading('New player')
    await screen.findByRole('button', { name: 'Create account' })

    expect(screen.queryByText(/You will also join/)).toBeNull()
  })

  it('says nothing when the demo cannot be asked for, and the form still works', async () => {
    installFakeApi({ ...apiRoutes, 'GET /api/demo': { status: 500, body: { title: 'Something broke' } } })

    renderApp('/register')
    await heading('New player')

    expect(screen.queryByText(/You will also join/)).toBeNull()
    expect(screen.getByLabelText('Email')).toBeTruthy()
  })

  it('is not on the sign-in page (that one has the demo accounts instead)', async () => {
    installFakeApi({ ...apiRoutes, 'GET /api/demo': { status: 200, body: demoInfo() } })

    renderApp('/login')
    await heading('Sign in')
    await screen.findByRole('region', { name: 'Just looking around?' })

    expect(screen.queryByText(/You will also join/)).toBeNull()
  })
})
