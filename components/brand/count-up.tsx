"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Animates a number from its previous value to the new one (≈700ms, ease-out).
 * Snaps instantly under prefers-reduced-motion. Formatting is supplied by the caller
 * so that the displayed figure always matches the app's existing formatter.
 */
export function CountUp({
  value,
  format,
  duration = 700,
  className,
}: {
  value: number
  format: (n: number) => string
  duration?: number
  className?: string
}) {
  const [display, setDisplay] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (reduce || !Number.isFinite(value)) {
      setDisplay(value)
      from.current = value
      return
    }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(a + (value - a) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <span className={className}>{format(display)}</span>
}
