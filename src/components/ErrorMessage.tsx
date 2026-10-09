import { ApiError } from '../api/client'

interface ErrorMessageProps {
  error: unknown
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  return (
    <div className="error-message" role="alert">
      {describe(error)}
    </div>
  )
}

function describe(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  // fetch throws a TypeError when it can't reach the server at all (API stopped, or blocked by CORS)
  if (error instanceof TypeError) {
    return `Can't reach the API at ${import.meta.env.VITE_API_URL}. Is it running?`
  }

  return 'Something went wrong.'
}
