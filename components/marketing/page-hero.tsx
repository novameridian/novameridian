import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Shared header block for secondary public pages (About, FAQ, Security, Contact, legal). */
export function PageHero({
  eyebrow,
  title,
  description,
  className,
  children,
}: {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  className?: string
  children?: ReactNode
}) {
  return (
    <section className={cn("relative overflow-hidden border-b border-border", className)}>
      <div className="pointer-events-none absolute inset-0 bg-horizon-glow" />
      <div className="pointer-events-none absolute inset-0 bg-meridian-grid opacity-70" />
      <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-16 sm:pb-20 sm:pt-24 lg:px-8">
        <p className="eyebrow animate-fade-up">{eyebrow}</p>
        <h1 className="text-h1 mt-5 max-w-3xl animate-fade-up [animation-delay:80ms]">{title}</h1>
        {description && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-body animate-fade-up [animation-delay:160ms]">
            {description}
          </p>
        )}
        {children && <div className="mt-8 animate-fade-up [animation-delay:240ms]">{children}</div>}
      </div>
    </section>
  )
}
