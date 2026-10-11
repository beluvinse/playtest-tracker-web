import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { BugArt } from '../components/BugArt'
import { ErrorMessage } from '../components/ErrorMessage'
import { FieldErrors } from '../components/FieldErrors'
import { getRedirectTarget } from '../auth/redirect'
import { useAuth } from '../auth/useAuth'

// Same limits as RegisterDto in the API. The browser checks them first (instant feedback);
// the API checks them again, and also decides what the browser can't (is the email free?).
const displayNameMinLength = 2
const displayNameMaxLength = 50
const passwordMinLength = 8

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: register,
    // The account comes already signed in, so the person goes straight into the app
    onSuccess: () => navigate(getRedirectTarget(location.state), { replace: true }),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate({ displayName: displayName.trim(), email: email.trim(), password })
  }

  // Problems the API attached to a field go under that field (email taken, weak password…);
  // anything else (API down…) goes in a box above the button
  const apiError = mutation.error
  const fieldErrors = apiError instanceof ApiError ? apiError.fieldErrors : {}
  const hasFieldErrors = Object.keys(fieldErrors).length > 0

  return (
    <>
      <div className="press-start">
        <BugArt size={88} />
        <div>
          <h1 className="press-start-title">
            New player
            <span className="blink" aria-hidden="true">
              _
            </span>
          </h1>
          <p className="press-start-text">Create your account to start tracking bugs.</p>
        </div>
      </div>

      <form className="project-form auth-form" onSubmit={handleSubmit}>
        <label className="form-field">
          Your name
          <input
            type="text"
            name="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={displayNameMinLength}
            maxLength={displayNameMaxLength}
            placeholder="belu"
            aria-invalid={Boolean(fieldErrors.displayName)}
            autoComplete="nickname"
            autoFocus
          />
        </label>
        <FieldErrors messages={fieldErrors.displayName} />

        <label className="form-field">
          Email
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={256}
            aria-invalid={Boolean(fieldErrors.email)}
            autoComplete="email"
          />
        </label>
        <FieldErrors messages={fieldErrors.email} />

        <label className="form-field">
          Password
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={passwordMinLength}
            maxLength={100}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby="password-hint"
            // "new-password" lets password managers offer to generate and save one
            autoComplete="new-password"
          />
        </label>
        <FieldErrors messages={fieldErrors.password} />
        <p id="password-hint" className="form-hint">
          at least {passwordMinLength} characters, with a number and a lowercase letter
        </p>

        {apiError && !hasFieldErrors && <ErrorMessage error={apiError} />}

        <div className="form-actions">
          <button type="submit" className="button-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </form>

      <p className="auth-switch">
        Already have an account?{' '}
        <Link to="/login" state={location.state}>
          Sign in
        </Link>
      </p>
    </>
  )
}
