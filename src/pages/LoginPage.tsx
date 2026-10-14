import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import type { DemoAccountDto } from '../api/types'
import { BugArt } from '../components/BugArt'
import { DemoAccounts } from '../components/DemoAccounts'
import { ErrorMessage } from '../components/ErrorMessage'
import { FieldErrors } from '../components/FieldErrors'
import { useDemoInfo } from '../hooks/useDemoInfo'
import { useFormValidation } from '../hooks/useFormValidation'
import { getRedirectTarget } from '../auth/redirect'
import { useAuth } from '../auth/useAuth'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: login,
    // Back to the page the person was trying to open (or the home page)
    onSuccess: () => navigate(getRedirectTarget(location.state), { replace: true }),
  })

  // The demo accounts, if there is a demo: the same sign-in, with the account chosen by a click
  const demo = useDemoInfo()
  function enterDemo(account: DemoAccountDto) {
    if (demo) mutation.mutate({ email: account.email, password: demo.password })
  }

  const { validate, forgetError, messagesFor } = useFormValidation()
  const emailMessages = messagesFor('email', undefined)
  const passwordMessages = messagesFor('password', undefined)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate(event.currentTarget)) return
    mutation.mutate({ email: email.trim(), password })
  }

  return (
    <>
      <div className="press-start">
        <BugArt size={88} />
        <div>
          <h1 className="press-start-title">
            Sign in
            <span className="blink" aria-hidden="true">
              _
            </span>
          </h1>
          <p className="press-start-text">Welcome back. Your bugs are where you left them.</p>
        </div>
      </div>

      {/* noValidate turns off the browser's own error bubble; useFormValidation shows ours */}
      <form
        className="project-form auth-form"
        onSubmit={handleSubmit}
        onInput={forgetError}
        noValidate
      >
        <label className="form-field">
          Email
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={256}
            aria-invalid={Boolean(emailMessages)}
            // Tells the browser and password managers what each field is, so they can fill it in
            autoComplete="username"
            autoFocus
          />
        </label>
        <FieldErrors messages={emailMessages} />

        <label className="form-field">
          Password
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            maxLength={100}
            aria-invalid={Boolean(passwordMessages)}
            autoComplete="current-password"
          />
        </label>
        <FieldErrors messages={passwordMessages} />

        {/* "Invalid email or password" (the API doesn't say which), or the lockout message, or
            "can't reach the API": all come as the error's message */}
        {mutation.error && <ErrorMessage error={mutation.error} />}

        <div className="form-actions">
          <button type="submit" className="button-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>

      <p className="auth-switch">
        New here?{' '}
        {/* state: keeps "where I was going" if the person decides to create an account instead */}
        <Link to="/register" state={location.state}>
          Create an account
        </Link>
      </p>

      {demo && <DemoAccounts info={demo} onEnter={enterDemo} disabled={mutation.isPending} />}
    </>
  )
}
