import { useState } from 'react'
import type { FormEvent } from 'react'

type Field = HTMLInputElement | HTMLTextAreaElement

// Replaces the little bubble the browser shows when a form has a problem ("Please lengthen this
// text to 8 characters or more…") with messages written by us, in the style of the app.
//
// The rules stay where they already were: the HTML attributes of each field (required, minLength,
// type="email", pattern). The form gets noValidate, which only turns off the BUBBLE, and this hook
// reads those same attributes to decide what is wrong and what to say.
//
// Every field needs a `name`: the messages are kept by name.
//
// How to use it:
//   const { validate, forgetError, messagesFor } = useFormValidation()
//   <form noValidate onSubmit={e => { e.preventDefault(); if (validate(e.currentTarget)) send() }}
//         onInput={forgetError}>
//   <FieldErrors messages={messagesFor('email', fieldErrorsFromTheApi.email)} />
export function useFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Checks every field of the form. Returns true if all are fine. If not, shows a message under
  // each field that isn't, and puts the cursor in the first one.
  function validate(form: HTMLFormElement): boolean {
    const found: Record<string, string> = {}
    let firstInvalid: Field | null = null

    for (const element of Array.from(form.elements)) {
      if (!isTextField(element) || element.name === '') continue

      const message = problemWith(element)
      if (message === null) continue

      found[element.name] = message
      firstInvalid ??= element
    }

    setErrors(found)
    firstInvalid?.focus()

    return firstInvalid === null
  }

  // For the form's onInput: when someone starts fixing a field, its message goes away
  function forgetError(event: FormEvent<HTMLFormElement>) {
    const name = (event.target as Partial<Field>).name
    if (!name) return

    setErrors((current) => {
      if (!(name in current)) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  // What to show under a field: our message if it has one, otherwise what the API said about it
  function messagesFor(name: string, fromApi: string[] | undefined): string[] | undefined {
    return name in errors ? [errors[name]] : fromApi
  }

  return { validate, forgetError, messagesFor }
}

function isTextField(element: Element): element is Field {
  return (
    (element instanceof HTMLInputElement &&
      element.type !== 'radio' &&
      element.type !== 'checkbox' &&
      element.type !== 'submit') ||
    element instanceof HTMLTextAreaElement
  )
}

// What is wrong with a field, in words, or null if nothing is
function problemWith(field: Field): string | null {
  // Spaces alone don't count as writing something (the app trims text before sending it),
  // but a password is taken exactly as typed
  const value = field.type === 'password' ? field.value : field.value.trim()

  if (field.required && value === '') {
    return 'This field is required.'
  }

  // An empty optional field has nothing to check
  if (value === '') return null

  if (field.validity.typeMismatch && field.type === 'email') {
    return 'Enter a valid email address, like name@example.com.'
  }

  // Checked by hand, not with validity.tooShort: browsers only flag that when the person typed
  // the text themselves, and miss text that a password manager filled in
  if (field.minLength > 0 && value.length < field.minLength) {
    return `Use at least ${field.minLength} characters.`
  }

  // For fields with a pattern, the `title` attribute says what the pattern asks for
  if (field.validity.patternMismatch) {
    return field.title ? `${field.title}.` : 'Use the format shown.'
  }

  return null
}
