import { fireEvent, render, screen } from '@testing-library/react'
import type { FormEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FieldErrors } from '../components/FieldErrors'
import { useFormValidation } from './useFormValidation'

// A form with one field of each kind, with its rules written as plain HTML attributes
// (that's how the app's forms declare them). It shows whatever the hook says under each field.
function TestForm({
  onValid,
  fromApi = {},
}: {
  onValid: () => void
  fromApi?: Record<string, string[]>
}) {
  const { validate, forgetError, messagesFor } = useFormValidation()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (validate(event.currentTarget)) onValid()
  }

  return (
    <form onSubmit={handleSubmit} onInput={forgetError} noValidate>
      <label>
        Name
        <input name="name" required minLength={2} />
      </label>
      <FieldErrors messages={messagesFor('name', fromApi.name)} />

      <label>
        Email
        <input name="email" type="email" required />
      </label>
      <FieldErrors messages={messagesFor('email', fromApi.email)} />

      <label>
        Password
        <input name="password" type="password" minLength={8} />
      </label>
      <FieldErrors messages={messagesFor('password', fromApi.password)} />

      <label>
        Code
        <input name="code" pattern="[A-Z]{3}" title="Exactly 3 capital letters" />
      </label>
      <FieldErrors messages={messagesFor('code', fromApi.code)} />

      <label>
        Notes
        <textarea name="notes" />
      </label>

      <button type="submit">Send</button>
    </form>
  )
}

function fill(label: string, value: string) {
  fireEvent.input(screen.getByLabelText(label), { target: { value } })
}

function send() {
  fireEvent.click(screen.getByRole('button', { name: 'Send' }))
}

// A form where every required field is fine, for tests that break one thing at a time
function fillValidForm() {
  fill('Name', 'Ana')
  fill('Email', 'ana@test.local')
}

describe('useFormValidation', () => {
  it('lets a valid form through and shows nothing', () => {
    const onValid = vi.fn()
    render(<TestForm onValid={onValid} />)
    fillValidForm()

    send()

    expect(onValid).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('stops an empty required field and says so in its own words', () => {
    const onValid = vi.fn()
    render(<TestForm onValid={onValid} />)

    send()

    expect(onValid).not.toHaveBeenCalled()
    // One message each for the two required fields
    expect(screen.getAllByText('This field is required.')).toHaveLength(2)
  })

  it('puts the cursor in the first field with a problem', () => {
    render(<TestForm onValid={vi.fn()} />)
    fill('Name', 'Ana') // fine; the email is the first one wrong

    send()

    expect(document.activeElement).toBe(screen.getByLabelText('Email'))
  })

  it('does not count spaces alone as writing something', () => {
    render(<TestForm onValid={vi.fn()} />)
    fill('Name', '    ')
    fill('Email', 'ana@test.local')

    send()

    expect(screen.getByText('This field is required.')).toBeTruthy()
  })

  it('says how many characters are needed when the text is too short', () => {
    render(<TestForm onValid={vi.fn()} />)
    fill('Name', 'A')
    fill('Email', 'ana@test.local')

    send()

    expect(screen.getByText('Use at least 2 characters.')).toBeTruthy()
  })

  it('measures the length without the spaces around the text, except in passwords', () => {
    const onValid = vi.fn()
    render(<TestForm onValid={onValid} />)
    fillValidForm()

    fill('Name', ' A ') // 3 characters with spaces, 1 without
    fill('Password', 'abc     ') // 8 characters, the spaces count in a password
    send()

    expect(screen.getByText('Use at least 2 characters.')).toBeTruthy()
    expect(screen.queryByText('Use at least 8 characters.')).toBeNull()
  })

  it('explains an email that is not an email', () => {
    render(<TestForm onValid={vi.fn()} />)
    fill('Name', 'Ana')
    fill('Email', 'not-an-email')

    send()

    expect(screen.getByText('Enter a valid email address, like name@example.com.')).toBeTruthy()
  })

  it('uses the field\'s title to explain a pattern it does not match', () => {
    render(<TestForm onValid={vi.fn()} />)
    fillValidForm()
    fill('Code', 'ab1')

    send()

    expect(screen.getByText('Exactly 3 capital letters.')).toBeTruthy()
  })

  it('leaves an empty optional field alone, but still checks it once filled', () => {
    const onValid = vi.fn()
    render(<TestForm onValid={onValid} />)
    fillValidForm()

    send() // password and code are optional and empty
    expect(onValid).toHaveBeenCalledTimes(1)

    fill('Password', 'short')
    send()
    expect(screen.getByText('Use at least 8 characters.')).toBeTruthy()
    expect(onValid).toHaveBeenCalledTimes(1)
  })

  it('removes a field\'s message as soon as the person starts fixing that field, and only that one', () => {
    render(<TestForm onValid={vi.fn()} />)
    send() // name and email are both missing
    expect(screen.getAllByText('This field is required.')).toHaveLength(2)

    fill('Name', 'A')

    // The name's message is gone; the email's is still there
    expect(screen.getAllByText('This field is required.')).toHaveLength(1)
  })

  it('shows what the API said about a field, until our own check has something to say', () => {
    render(<TestForm onValid={vi.fn()} fromApi={{ email: ['There is already an account.'] }} />)
    expect(screen.getByText('There is already an account.')).toBeTruthy()

    send() // our check finds the empty email: that message takes the place of the API's

    expect(screen.queryByText('There is already an account.')).toBeNull()
    expect(screen.getAllByText('This field is required.')).toHaveLength(2)
  })
})
