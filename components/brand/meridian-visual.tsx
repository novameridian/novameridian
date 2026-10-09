import { useId } from "react"
import { cn } from "@/lib/utils"

/**
 * Abstract hero visual: concentric meridian rings, a latitude grid and a
 * single growth curve that draws on load. Purely illustrative — it carries
 * no figures and makes no performance claim.
 */
export function MeridianVisual({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "")
  const curve = "M40 330 C 120 320, 150 250, 215 232 S 320 190, 372 140 S 470 70, 540 48"
  return (
    <div className={cn("relative aspect-[5/4] w-full select-none", className)} aria-hidden="true">
      <svg viewBox="0 0 580 460" className="absolute inset-0 size-full overflow-visible" fill="none">
        <defs>
          <linearGradient id={`g-${id}`} x1="40" y1="330" x2="540" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#19D3C5" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id={`f-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#19D3C5" stopOpacity=".22" />
            <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`r-${id}`} cx=".5" cy=".5" r=".5">
            <stop stopColor="#19D3C5" stopOpacity=".18" />
            <stop offset="1" stopColor="#19D3C5" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`c-${id}`}>
            <circle cx="300" cy="230" r="196" />
          </clipPath>
        </defs>

        <circle cx="300" cy="230" r="230" fill={`url(#r-${id})`} />

        {/* globe geometry */}
        <g stroke="currentColor" className="text-foreground" strokeOpacity=".14" strokeWidth="1">
          <circle cx="300" cy="230" r="196" />
          <circle cx="300" cy="230" r="150" strokeOpacity=".09" />
          <circle cx="300" cy="230" r="104" strokeOpacity=".07" />
          <g clipPath={`url(#c-${id})`}>
            <ellipse cx="300" cy="230" rx="68" ry="196" />
            <ellipse cx="300" cy="230" rx="132" ry="196" strokeOpacity=".09" />
            <path d="M104 230h392" />
            <path d="M120 150h360M120 310h360" strokeOpacity=".08" />
          </g>
        </g>

        {/* area + curve */}
        <path d={`${curve} L540 330 L40 330 Z`} fill={`url(#f-${id})`} clipPath={`url(#c-${id})`} opacity=".9" />
        <path
          d={curve}
          stroke={`url(#g-${id})`}
          strokeWidth="3"
          strokeLinecap="round"
          className="animate-draw"
          style={{ ["--len" as string]: 760, strokeDasharray: 760 }}
        />

        {/* position markers */}
        <g>
          <circle cx="215" cy="232" r="4" fill="#19D3C5" />
          <circle cx="372" cy="140" r="4" fill="#3B82F6" />
          <circle cx="540" cy="48" r="5.5" fill="#19D3C5" />
          <circle cx="540" cy="48" r="13" stroke="#19D3C5" strokeOpacity=".4" />
          <circle cx="540" cy="48" r="22" stroke="#19D3C5" strokeOpacity=".16" />
        </g>
        <path d="M540 48V330" stroke="#19D3C5" strokeOpacity=".28" strokeDasharray="3 5" />
      </svg>

      {/* floating cards: structure only, no numbers */}
      <div className="absolute left-0 top-[12%] w-[44%] rounded-2xl border border-border bg-card/85 p-4 shadow-md backdrop-blur-md animate-fade-up [animation-delay:350ms]">
        <div className="h-1.5 w-10 rounded-full bg-brand/70" />
        <div className="mt-3 h-2.5 w-3/4 rounded-full bg-foreground/15" />
        <div className="mt-2 h-2.5 w-1/2 rounded-full bg-foreground/10" />
        <div className="mt-4 flex items-end gap-1">
          {[34, 52, 40, 66, 58, 82].map((h, i) => (
            <span key={i} className="w-full rounded-sm bg-gradient-to-t from-brand/30 to-brand-2/70" style={{ height: h * 0.55 }} />
          ))}
        </div>
      </div>
      <div className="absolute bottom-[6%] right-[2%] flex items-center gap-3 rounded-2xl border border-border bg-card/85 px-4 py-3 shadow-md backdrop-blur-md animate-fade-up [animation-delay:550ms]">
        <span className="grid size-8 place-items-center rounded-full bg-brand/15">
          <span className="size-2 rounded-full bg-brand" />
        </span>
        <div>
          <div className="h-2 w-20 rounded-full bg-foreground/15" />
          <div className="mt-1.5 h-2 w-12 rounded-full bg-foreground/10" />
        </div>
      </div>
    </div>
  )
}
