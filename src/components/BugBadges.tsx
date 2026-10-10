import type { BugStatus, Severity } from '../api/types'
import { statusLabels } from '../utils/format'

// ---- Severity: a 4-step meter (like a signal bar) plus a short code ----

const severityInfo: Record<Severity, { code: string; level: number }> = {
  Low: { code: 'LOW', level: 1 },
  Medium: { code: 'MED', level: 2 },
  High: { code: 'HIGH', level: 3 },
  Critical: { code: 'CRIT', level: 4 },
}

const barHeights = [4, 6, 8, 10]

export function SeverityMeter({ severity }: { severity: Severity }) {
  const { code, level } = severityInfo[severity]
  return (
    // The color comes from CSS (data-severity); bars use currentColor, empty ones a line color
    <span className="severity" data-severity={severity}>
      <span className="severity-bars" aria-hidden="true">
        {barHeights.map((height, index) => (
          <span key={height} style={{ height }} data-filled={index < level} />
        ))}
      </span>
      {/* Screen readers read the full word, not "MED" */}
      <span aria-hidden="true">{code}</span>
      <span className="visually-hidden">{severity}</span>
    </span>
  )
}

// ---- Status: a 4×4 pixel icon plus the label ----

const statusIcons: Record<BugStatus, string> = {
  Open: 'M0 0h4v1h-4zM0 3h4v1h-4zM0 1h1v2h-1zM3 1h1v2h-1z', // hollow square
  InProgress: 'M0 0h2v4h-2zM2 0h2v1h-2zM2 3h2v1h-2zM3 1h1v2h-1z', // half filled
  Resolved: 'M0 2h1v1h-1zM1 3h1v1h-1zM2 2h1v1h-1zM3 1h1v1h-1z', // check mark
  Closed: 'M0 0h4v4h-4z', // full square
}

export function StatusLabel({ status }: { status: BugStatus }) {
  return (
    <span className="status" data-status={status}>
      <svg width="8" height="8" viewBox="0 0 4 4" shapeRendering="crispEdges" aria-hidden="true">
        <path fill="currentColor" d={statusIcons[status]} />
      </svg>
      <span className="status-label">{statusLabels[status]}</span>
    </span>
  )
}
