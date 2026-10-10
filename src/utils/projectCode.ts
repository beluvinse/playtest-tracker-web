// Every project has a unique 3-letter code, stored by the API ("PIN").
// Bugs are shown with it in front: bug 7 of PIN → "PIN-007".
export function bugCode(projectCode: string, bugId: number): string {
  return `${projectCode}-${String(bugId).padStart(3, '0')}`
}

// A first guess for a new project's code, from its name: "Pink in the Night" → "PIN".
// Only letters count; a short name is padded with X ("Go" → "GOX"). It's just a suggestion:
// the person can change it, and the API checks it's free.
export function suggestCode(name: string): string {
  const letters = name.replace(/[^a-z]/gi, '').toUpperCase()
  return letters.slice(0, 3).padEnd(3, 'X')
}
