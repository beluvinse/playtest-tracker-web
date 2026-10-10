import { useEffect } from 'react'
import type { RefObject } from 'react'

// Closes a <details> popup (a menu) on a click outside it or on Escape.
// <details> opens and closes by itself, but it doesn't do these two.
export function useDismiss(ref: RefObject<HTMLDetailsElement | null>) {
  useEffect(() => {
    function close(event: MouseEvent | KeyboardEvent) {
      const details = ref.current
      if (!details?.open) return
      const clickedOutside = event instanceof MouseEvent && !details.contains(event.target as Node)
      const pressedEscape = event instanceof KeyboardEvent && event.key === 'Escape'
      if (clickedOutside || pressedEscape) details.open = false
    }
    document.addEventListener('click', close)
    document.addEventListener('keydown', close)
    // Remove the listeners when the component goes away, or they would pile up
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('keydown', close)
    }
  }, [ref])
}
