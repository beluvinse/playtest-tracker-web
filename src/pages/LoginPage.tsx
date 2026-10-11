import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { BugArt } from '../components/BugArt'
import { ErrorMessage } from '../components/ErrorMessage'
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

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
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

      <form className="project-form auth-form" onSubmit={handleSubmit}>
        <label className="form-field">
          Email
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={256}
            // Tells the browser and password managers what each field is, so they can fill it in
            autoComplete="username"
            autoFocus
          />
        </label>

        <label className="form-field">
          Password
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            maxLength={100}
            autoComplete="current-password"
          />
        </label>

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
    </>
  )
}
