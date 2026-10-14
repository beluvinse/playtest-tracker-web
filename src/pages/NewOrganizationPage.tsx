import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { createOrganization, organizationKeys } from '../api/organizations'
import { BugArt } from '../components/BugArt'
import { ErrorMessage } from '../components/ErrorMessage'
import { FieldErrors } from '../components/FieldErrors'
import { useFormValidation } from '../hooks/useFormValidation'

// Same limits as OrganizationRequestDto in the API. The browser checks them first (instant
// feedback); the API checks them again, because anyone can call it without this form.
const nameMinLength = 2
const nameMaxLength = 100

// /organizations/new: a group of people who share projects and bugs. Whoever creates it is its Owner.
export function NewOrganizationPage() {
  const [name, setName] = useState('')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { validate, forgetError, messagesFor } = useFormValidation()

  const mutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: (organization) => {
      // The list of their organizations has a new one (the switcher, the "People" count…)
      queryClient.invalidateQueries({ queryKey: organizationKeys.all })
      navigate(`/organizations/${organization.id}`)
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate(event.currentTarget)) return
    mutation.mutate({ name: name.trim() })
  }

  // The API's own message about the name, if it has one; anything else (API down, 500…) goes in a box
  const apiError = mutation.error
  const fieldErrors = apiError instanceof ApiError ? apiError.fieldErrors : {}
  const hasFieldErrors = Object.keys(fieldErrors).length > 0
  const nameMessages = messagesFor('name', fieldErrors.name)

  return (
    <div className="new-project">
      <section className="new-project-main page-band">
        <div className="press-start">
          <BugArt />
          <div>
            <h1 className="press-start-title">
              New organization
              <span className="blink" aria-hidden="true">
                _
              </span>
            </h1>
            <p className="press-start-text">
              A group of people who share projects and bugs. You will be its owner, and you can add
              the others by email.
            </p>
          </div>
        </div>

        {/* noValidate turns off the browser's own error bubble; useFormValidation shows ours */}
        <form className="project-form" onSubmit={handleSubmit} onInput={forgetError} noValidate>
          <label className="form-field">
            Organization name
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={nameMinLength}
              maxLength={nameMaxLength}
              placeholder="Night Owls Studio"
              aria-invalid={Boolean(nameMessages)}
              autoFocus
            />
          </label>
          <FieldErrors messages={nameMessages} />

          {apiError && !hasFieldErrors && <ErrorMessage error={apiError} />}

          <div className="form-actions">
            <button type="submit" className="button-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create organization'}
            </button>
            <span className="form-hint">enter ↵</span>
          </div>
        </form>
      </section>
    </div>
  )
}
