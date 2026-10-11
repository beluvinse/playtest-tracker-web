interface CodeInputProps {
  value: string
  onChange: (code: string) => void
  invalid: boolean // the API rejected it (taken, or not 3 letters)
}

// The project code field: exactly 3 letters. It cleans what you type as you type it
// ("p1n" → "PN"), so the format is right before anything is sent. Whether the code
// is free is something only the API knows: a taken code comes back as a 409.
export function CodeInput({ value, onChange, invalid }: CodeInputProps) {
  return (
    <label className="form-field form-field-code">
      Code
      <input
        type="text"
        name="code"
        value={value}
        onChange={(e) => onChange(cleanCode(e.target.value))}
        required
        minLength={3}
        maxLength={3}
        pattern="[A-Z]{3}"
        title="Exactly 3 letters"
        autoComplete="off"
        spellCheck={false}
        aria-invalid={invalid}
        aria-describedby="code-hint"
      />
    </label>
  )
}

// Keeps letters only, in uppercase, and at most 3 of them
function cleanCode(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3)
}
