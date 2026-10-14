import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { BugArt } from '../components/BugArt'
import { ErrorMessage } from '../components/ErrorMessage'
import { FieldErrors } from '../components/FieldErrors'
import { PixelIcon } from '../components/PixelIcon'
import { useDemoInfo } from '../hooks/useDemoInfo'
import { useFormValidation } from '../hooks/useFormValidation'
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

  // The example organization, if there is one: everybody who signs up also joins it
  const demo = useDemoInfo()

  const { validate, forgetError, messagesFor } = useFormValidation()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate(event.currentTarget)) return
    mutation.mutate({ displayName: displayName.trim(), email: email.trim(), password })
  }

  // Problems the API attached to a field go under that field (email taken, weak password…);
  // anything else (API down…) goes in a box above the button. Under each field, our own
  // message (from the browser-side check, before anything is sent) takes the place of the API's.
  const apiError = mutation.error
  const fieldErrors = apiError instanceof ApiError ? apiError.fieldErrors : {}
  const hasFieldErrors = Object.keys(fieldErrors).length > 0
  const nameMessages = messagesFor('displayName', fieldErrors.displayName)
  const emailMessages = messagesFor('email', fieldErrors.email)
  const passwordMessages = messagesFor('password', fieldErrors.password)

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

      {/* noValidate turns off the browser's own error bubble; useFormValidation shows ours */}
      <form
        className="project-form auth-form"
        onSubmit={handleSubmit}
        onInput={forgetError}
        noValidate
      >
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
            aria-invalid={Boolean(nameMessages)}
            autoComplete="nickname"
            autoFocus
          />
        </label>
        <FieldErrors messages={nameMessages} />

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
            autoComplete="email"
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
            minLength={passwordMinLength}
            maxLength={100}
            aria-invalid={Boolean(passwordMessages)}
            aria-describedby="password-hint"
            // "new-password" lets password managers offer to generate and save one
            autoComplete="new-password"
          />
        </label>
        <FieldErrors messages={passwordMessages} />
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

      {/* Everybody who signs up also joins the example organization: better to say so before than
          to let it surprise them afterwards. Nothing is said if there is no demo. */}
      {demo && (
        <p className="demo-note">
          <PixelIcon name="team" size={12} />
          <span>
            You will also join <strong>{demo.organizationName}</strong>, an example organization
            anybody can look around in. Everything in it is shared with the others who try the app, and
            you can't leave it. Your own organization is created for you too.
          </span>
        </p>
      )}

      <p className="auth-switch">
        Already have an account?{' '}
        <Link to="/login" state={location.state}>
          Sign in
        </Link>
      </p>
    </>
  )
}
