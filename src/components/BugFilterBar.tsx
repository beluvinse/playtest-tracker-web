import { useState } from 'react'
import type { FormEvent } from 'react'
import { bugStatuses, severities } from '../api/types'
import { sortOptions } from '../hooks/useBugFilters'
import type { BugFilters, FilterName, SortKey } from '../hooks/useBugFilters'

interface BugFilterBarProps {
  filters: BugFilters
  onChange: (name: FilterName, value: string | undefined) => void
  onClear: () => void
  hasFilters: boolean
}

// "any" first (empty value), then every option of the list
const statusOptions = [{ value: '', label: 'any' }, ...bugStatuses.map(toOption)]
const severityOptions = [{ value: '', label: 'any' }, ...severities.map(toOption)]
const sortTokenOptions = (Object.keys(sortOptions) as SortKey[]).map((key) => ({
  value: key,
  label: sortOptions[key].label.toLowerCase(),
}))

// A single line of "key:value" tokens, like a debug console: › search  status:open  severity:any
export function BugFilterBar({ filters, onChange, onClear, hasFilters }: BugFilterBarProps) {
  return (
    <div className="filter-row" role="search" aria-label="Bug filters">
      <span className="filter-prompt" aria-hidden="true">
        ›
      </span>

      {/* key: when the search in the URL changes from outside (Back button, "clear"),
          React creates a new box, so the text inside matches the URL again */}
      <SearchBox
        key={filters.search ?? ''}
        value={filters.search}
        onSearch={(text) => onChange('search', text)}
      />

      <TokenSelect
        name="status"
        value={filters.status ?? ''}
        options={statusOptions}
        onChange={(value) => onChange('status', value)}
      />
      <TokenSelect
        name="severity"
        value={filters.severity ?? ''}
        options={severityOptions}
        onChange={(value) => onChange('severity', value)}
      />
      <TokenSelect
        name="sort"
        value={filters.sort}
        options={sortTokenOptions}
        onChange={(value) => onChange('sort', value)}
      />

      {hasFilters && (
        <button type="button" className="filter-clear" onClick={onClear}>
          clear
        </button>
      )}
    </div>
  )
}

interface TokenOption {
  value: string
  label: string
}

interface TokenSelectProps {
  name: string
  value: string
  options: TokenOption[]
  onChange: (value: string) => void
}

// A <select> dressed as a "name:value" token, highlighted while it filters something.
// The text you see is drawn by the spans; the real <select> lies on top of the whole token,
// invisible. So a click anywhere on the token (the name too) lands on it and opens its list.
function TokenSelect({ name, value, options, onChange }: TokenSelectProps) {
  const isActive = name !== 'sort' && value !== ''
  const selected = options.find((option) => option.value === value) ?? options[0]

  return (
    <span className="token" data-active={isActive}>
      <span className="token-key" aria-hidden="true">
        {name}:
      </span>
      <span className="token-value" aria-hidden="true">
        {selected.label}
      </span>
      {/* aria-label: the visible spans are hidden from screen readers, so the select says it */}
      <select aria-label={name} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </span>
  )
}

// "InProgress" → { value: "InProgress", label: "in-progress" }, the style of the design's tokens
function toOption(value: string): TokenOption {
  return { value, label: value.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() }
}

interface SearchBoxProps {
  value: string | undefined
  onSearch: (text: string) => void
}

// The search is applied on Enter (not on every key), so the URL and the API
// get one request per search instead of one per letter
function SearchBox({ value, onSearch }: SearchBoxProps) {
  const [text, setText] = useState(value ?? '')

  function handleSubmit(event: FormEvent) {
    event.preventDefault() // a form would otherwise reload the whole page
    onSearch(text.trim())
  }

  return (
    <form className="filter-search" onSubmit={handleSubmit}>
      <input
        type="search"
        aria-label="Search bugs by title or description"
        placeholder="search title or description ⏎"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </form>
  )
}
