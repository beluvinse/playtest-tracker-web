import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { installFakeApi } from '../test/fakeApi'
import { apiRoutes, heading, renderApp } from '../test/renderApp'

describe('errors on the sign-in and sign-up forms', () => {
  describe('sign in', () => {
    it('shows our messages for empty fields, and sends nothing to the API', async () => {
      const api = installFakeApi(apiRoutes)
      renderApp('/login')
      await heading('Sign in')

      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

      expect(screen.getAllByText('This field is required.')).toHaveLength(2)
      expect(api.count('POST /api/auth/login')).toBe(0)
      expect(document.activeElement).toBe(screen.getByLabelText('Email'))
    })

    it('says when the email is not an email', async () => {
      installFakeApi(apiRoutes)
      renderApp('/login')
      await heading('Sign in')

      fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'sam@' } })
      fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'whatever1' } })
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

      expect(screen.getByText('Enter a valid email address, like name@example.com.')).toBeTruthy()
    })
  })

  describe('sign up', () => {
    async function openSignUp() {
      renderApp('/register')
      await heading('New player')
    }

    it('says how long a password has to be, before asking the API anything', async () => {
      const api = installFakeApi(apiRoutes)
      await openSignUp()

      fireEvent.input(screen.getByLabelText('Your name'), { target: { value: 'Ana' } })
      fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'ana@test.local' } })
      fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'abc1' } })
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

      expect(screen.getByText('Use at least 8 characters.')).toBeTruthy()
      expect(api.count('POST /api/auth/register')).toBe(0)
    })

    it('clears the message once the person edits the password', async () => {
      installFakeApi(apiRoutes)
      await openSignUp()
      fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'abc1' } })
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
      expect(screen.getByText('Use at least 8 characters.')).toBeTruthy()

      fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'abc12' } })

      expect(screen.queryByText('Use at least 8 characters.')).toBeNull()
    })

    it('still shows what the API says when the fields look fine (email already taken)', async () => {
      installFakeApi({
        ...apiRoutes,
        'POST /api/auth/register': {
          status: 409,
          body: { title: 'Email already in use', errors: { Email: ['There is already an account with this email.'] } },
        },
      })
      await openSignUp()

      fireEvent.input(screen.getByLabelText('Your name'), { target: { value: 'Ana' } })
      fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'ana@test.local' } })
      fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'Sunflower7' } })
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

      expect(
        await screen.findByText('There is already an account with this email.'),
      ).toBeTruthy()
    })
  })
})
