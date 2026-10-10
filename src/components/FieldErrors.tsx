// The API's validation messages for one field, shown right under it.
// role="alert" makes screen readers announce them as soon as they appear.
export function FieldErrors({ messages }: { messages: string[] | undefined }) {
  if (!messages?.length) return null
  return (
    <ul className="field-errors" role="alert">
      {messages.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  )
}
