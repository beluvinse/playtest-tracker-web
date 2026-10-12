import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../api/client'
import { addMember, organizationKeys } from '../api/organizations'
import { useFormValidation } from '../hooks/useFormValidation'
import { ErrorMessage } from './ErrorMessage'
import { FieldErrors } from './FieldErrors'

// "Add someone by email". Only the Owner sees it (the API refuses everybody else anyway).
// There are no invitations: the person has to have an account already.
export function AddMemberForm({ organizationId }: { organizationId: number }) {
  const [email, setEmail] = useState('')
  const [addedName, setAddedName] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { validate, forgetError, messagesFor } = useFormValidation()

  const mutation = useMutation({
    mutationFn: (address: string) => addMember(organizationId, { email: address }),
    onSuccess: (member) => {
      setEmail('')
      setAddedName(member.displayName)
      // The list of people and the counts ("People 3" in the sidebar, the organization switcher)
      // are out of date now. Everything about organizations starts with this key.
      queryClient.invalidateQueries({ queryKey: organizationKeys.all })
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAddedName(null)
    if (!validate(event.currentTarget)) return
    mutation.mutate(email.trim())
  }

  // What the API says about the email field: "nobody has signed up with it" (404) or "already
  // in" (409). Anything else (API down, 500…) goes in a box under the field.
  const apiError = mutation.error
  const fieldErrors = apiError instanceof ApiError ? apiError.fieldErrors : {}
  const hasFieldErrors = Object.keys(fieldErrors).length > 0
  const emailMessages = messagesFor('email', fieldErrors.email)

  return (
    <section className="member-add" aria-label="Add someone">
      {/* noValidate turns off the browser's own error bubble; useFormValidation shows ours */}
      <form className="project-form member-add-form" onSubmit={handleSubmit} onInput={forgetError} noValidate>
        <div className="member-add-row">
          <label className="form-field">
            Add someone by email
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                mutation.reset() // an old answer from the API no longer applies to a new email
              }}
              required
              maxLength={256}
              placeholder="ben@example.com"
              autoComplete="off"
              aria-invalid={Boolean(emailMessages)}
            />
          </label>
          <button type="submit" className="button-primary button-small" disabled={mutation.isPending}>
            {mutation.isPending ? 'Adding…' : 'Add'}
          </button>
        </div>
        <FieldErrors messages={emailMessages} />

        {apiError && !hasFieldErrors && <ErrorMessage error={apiError} />}

        {addedName ? (
          <p className="form-hint" role="status">
            Added {addedName}. They can now see everything in this organization.
          </p>
        ) : (
          <p className="form-hint">They need to have an account already. Nobody is sent an email.</p>
        )}
      </form>
    </section>
  )
}
