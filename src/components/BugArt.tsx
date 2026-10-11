// The big pixel-art bug that greets you on the "Press start" screens (first run, sign in…).
// Drawn on a 16×16 grid; each path is a list of squares, and crispEdges keeps them sharp.
export function BugArt({ size = 112 }: { size?: number }) {
  return (
    <svg
      className="press-start-art"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path
        className="art-bug"
        d="M6 2h1v1h-1zM9 2h1v1h-1zM7 3h2v1h-2zM6 4h4v1h-4zM5 5h1v1h-1zM7 5h2v1h-2zM10 5h1v1h-1zM4 6h8v1h-8zM4 7h1v1h-1zM6 7h4v1h-4zM11 7h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM9 8h1v1h-1zM11 8h1v1h-1zM5 9h2v1h-2zM9 9h2v1h-2z"
      />
      <path className="art-ground" d="M0 12h16v1h-16z" />
      <path className="art-dots" d="M1 14h2v1h-2zM5 14h2v1h-2zM9 14h2v1h-2zM13 14h2v1h-2z" />
    </svg>
  )
}
