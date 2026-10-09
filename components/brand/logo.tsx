import { useId } from "react"
import { cn } from "@/lib/utils"

/**
 * Nova Meridian mark: a globe-ring crossed by a meridian ellipse,
 * with a single "nova" node marking position on the path.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "")
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("size-8 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={`nm-g-${id}`} x1="3" y1="3" x2="29" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#19D3C5" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="12.5" stroke={`url(#nm-g-${id})`} strokeWidth="1.75" />
      <ellipse cx="16" cy="16" rx="5.25" ry="12.5" stroke={`url(#nm-g-${id})`} strokeWidth="1.5" />
      <path d="M3.5 16h25" stroke={`url(#nm-g-${id})`} strokeWidth="1.25" strokeOpacity=".55" />
      <circle cx="22.4" cy="8.6" r="2.6" fill="#19D3C5" />
      <circle cx="22.4" cy="8.6" r="4.4" stroke="#19D3C5" strokeOpacity=".35" strokeWidth="1" />
    </svg>
  )
}

export function Logo({
  className,
  markClassName,
  showWordmark = true,
}: {
  className?: string
  markClassName?: string
  showWordmark?: boolean
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      {showWordmark && (
        <span className="font-display text-[15px] font-semibold uppercase tracking-[0.2em] text-foreground">
          Nova<span className="text-muted-foreground"> </span>
          <span className="font-medium text-foreground/70">Meridian</span>
        </span>
      )}
    </span>
  )
}
