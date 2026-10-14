import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router'
import { ApiError } from '../api/client'
import { getOrganizations, organizationKeys, renameOrganization } from '../api/organizations'
import type { OrganizationDto } from '../api/types'
import { DeleteOrganizationButton } from '../components/DeleteOrganizationButton'
import { ErrorMessage } from '../components/ErrorMessage'
import { FieldErrors } from '../components/FieldErrors'
import { OrganizationNotFound } from '../components/OrganizationNotFound'
import { useFormValidation } from '../hooks/useFormValidation'

// Same limits as OrganizationRequestDto in the API (the browser checks first, the API again)
const nameMinLength = 2
const nameMaxLength = 100

// The settings of one organization: /organizations/:organizationId/settings
export function OrganizationSettingsPage() {
  const organizationId = Number(useParams().organizationId)
  const isValidId = Number.isInteger(organizationId) && organizationId > 0

  // The list of the person's organizations, the same cache entry as the sidebar's. It is where
  // this organization, and what the person is in it, come from.
  const { data: organizations, isPending, error } = useQuery({
    queryKey: organizationKeys.all,
    queryFn: getOrganizations,
  })
  const organization = organizations?.find((candidate) => candidate.id === organizationId)

  if (!isValidId || (organizations && !organization)) {
    return <OrganizationNotFound />
  }

  if (error) {
    return (
      <div className="page-body">
        <ErrorMessage error={error} />
      </div>
    )
  }

  if (isPending || !organization) {
    return <p className="page-body muted">Loading settings…</p>
  }

  return (
    <>
      <section className="page-band" aria-label="Organization settings">
        <div className="band-eyebrow">{organization.name} · settings</div>
        <div className="band-title-row">
          <h1 className="band-title">Settings</h1>
        </div>
        <p className="band-description">How this organization is called, and what can be done with it.</p>
      </section>

      {/* Who can change it: only the Owner, and never the example organization */}
      {organization.isDemo ? (
        <p className="member-note">
          This is an example organization: it can't be renamed or deleted, so it is always there for
          the next person who tries the app.
        </p>
      ) : organization.myRole !== 'Owner' ? (
        <p className="member-note">Only the owner can change the settings of an organization.</p>
      ) : (
        <>
          <RenameForm organization={organization} />
          <section className="settings-section settings-danger" aria-label="Delete the organization">
            <h2 className="settings-heading">Delete this organization</h2>
            <p className="form-hint">
              Its projects have to be deleted first. People lose access to it, but keep their accounts.
            </p>
            <DeleteOrganizationButton organization={organization} isOnlyOne={organizations?.length === 1} />
          </section>
        </>
      )}
    </>
  )
}

// "Organization name" and "Save". It starts with the current name, and sends nothing if it
// hasn't changed.
function RenameForm({ organization }: { organization: OrganizationDto }) {
  const [name, setName] = useState(organization.name)
  const [saved, setSaved] = useState(false)
  const queryClient = useQueryClient()
  const { validate, forgetError, messagesFor } = useFormValidation()

  const mutation = useMutation({
    mutationFn: (newName: string) => renameOrganization(organization.id, { name: newName }),
    onSuccess: (updated) => {
      setName(updated.name)
      setSaved(true)
      // The new name is shown in the switcher, the breadcrumb of the page, the list…
      queryClient.invalidateQueries({ queryKey: organizationKeys.all })
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(false)
    if (!validate(event.currentTarget)) return

    // Nothing changed: no request
    if (name.trim() === organization.name) return

    mutation.mutate(name.trim())
  }

  const apiError = mutation.error
  const fieldErrors = apiError instanceof ApiError ? apiError.fieldErrors : {}
  const hasFieldErrors = Object.keys(fieldErrors).length > 0
  const nameMessages = messagesFor('name', fieldErrors.name)

  return (
    <section className="settings-section" aria-label="Rename the organization">
      {/* noValidate turns off the browser's own error bubble; useFormValidation shows ours */}
      <form className="project-form settings-form" onSubmit={handleSubmit} onInput={forgetError} noValidate>
        <div className="member-add-row">
          <label className="form-field">
            Organization name
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setSaved(false)
                mutation.reset() // an old answer from the API no longer applies to a new name
              }}
              required
              minLength={nameMinLength}
              maxLength={nameMaxLength}
              aria-invalid={Boolean(nameMessages)}
            />
          </label>
          <button type="submit" className="button-primary button-small" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
        <FieldErrors messages={nameMessages} />

        {apiError && !hasFieldErrors && <ErrorMessage error={apiError} />}

        {saved && (
          <p className="form-hint" role="status">
            Saved.
          </p>
        )}
      </form>
    </section>
  )
}
