import { severities } from '../api/types'
import type { Severity } from '../api/types'
import { SeverityMeter } from './BugBadges'

interface SeverityPickerProps {
  value: Severity
  onChange: (severity: Severity) => void
}

// A group of radio buttons drawn as boxes with the severity meter.
// Real radios underneath: one choice, and arrow keys move between options.
export function SeverityPicker({ value, onChange }: SeverityPickerProps) {
  return (
    <fieldset className="severity-picker">
      <legend className="form-field-legend">Severity</legend>
      <div className="severity-options">
        {severities.map((option) => (
          <label key={option} className="severity-option">
            <input
              type="radio"
              name="severity"
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            <SeverityMeter severity={option} />
          </label>
        ))}
      </div>
    </fieldset>
  )
}
