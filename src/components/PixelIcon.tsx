// Pixel-art icons drawn on a small grid (8×8 or 4×4). Each path is a list of rectangles,
// and shape-rendering="crispEdges" keeps the pixels sharp instead of blurred.

const icons = {
  bug: {
    size: 8,
    path: 'M2 0h1v1h-1zM5 0h1v1h-1zM3 1h2v1h-2zM2 2h4v1h-4zM1 3h1v1h-1zM3 3h2v1h-2zM6 3h1v1h-1zM0 4h8v1h-8zM0 5h1v1h-1zM2 5h4v1h-4zM7 5h1v1h-1zM0 6h1v1h-1zM2 6h1v1h-1zM5 6h1v1h-1zM7 6h1v1h-1zM1 7h2v1h-2zM5 7h2v1h-2z',
  },
  grid: { size: 8, path: 'M0 0h3v3h-3zM5 0h3v3h-3zM0 5h3v3h-3zM5 5h3v3h-3z' },
  // Two people side by side: for organizations
  team: { size: 8, path: 'M1 1h2v2h-2zM0 3h4v3h-4zM5 1h2v2h-2zM4 3h4v3h-4zM1 6h1v2h-1zM6 6h1v2h-1z' },
  plus: { size: 8, path: 'M3 0h2v3h3v2h-3v3h-2v-3h-3v-2h3z' },
  chevronDown: { size: 4, path: 'M0 1h4v1h-4zM1 2h2v1h-2z' },
  check: { size: 4, path: 'M0 2h1v1h-1zM1 3h1v1h-1zM2 2h1v1h-1zM3 1h1v1h-1z' },
}

export type IconName = keyof typeof icons

interface PixelIconProps {
  name: IconName
  size?: number
  className?: string
}

// Uses currentColor, so the icon takes the text color of whatever contains it
export function PixelIcon({ name, size = 12, className }: PixelIconProps) {
  const icon = icons[name]
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${icon.size} ${icon.size}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path fill="currentColor" d={icon.path} />
    </svg>
  )
}
