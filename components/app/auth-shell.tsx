import type { ReactNode } from "react"
import Link from "next/link"
import { Loader2, ShieldCheck, ReceiptText, ScrollText } from "lucide-react"

import { Logo } from "@/components/brand/logo"
import { MeridianVisual } from "@/components/brand/meridian-visual"
import { ThemeToggle } from "@/components/theme-toggle"

const POINTS = [
  { icon: ScrollText, text: "Plan terms are shown before you commit" },
  { icon: ReceiptText, text: "Every movement recorded in your ledger" },
  { icon: ShieldCheck, text: "Deposits and withdrawals reviewed by our team" },
]

/** Split-screen frame for sign-in, sign-up and related screens. */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="dark relative hidden overflow-hidden bg-background text-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 bg-horizon-glow" />
        <div className="pointer-events-none absolute inset-0 bg-meridian-grid opacity-80" />
        <Link href="/" className="relative w-fit rounded-md" aria-label="Nova Meridian home">
          <Logo />
        </Link>

        <div className="relative max-w-md">
          <MeridianVisual className="mb-10 max-w-sm opacity-95" />
          <h2 className="text-h1">A New Direction for Your Financial Future.</h2>
          <ul className="mt-8 space-y-3.5">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-center gap-3 text-sm text-body">
                <p.icon className="size-4 shrink-0 text-brand" aria-hidden="true" />
                {p.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-muted-foreground">
          Investing involves risk, including the possible loss of capital.
        </p>
      </aside>

      {/* Form panel */}
      <div className="relative flex min-h-svh flex-col">
        <header className="flex h-16 items-center justify-between px-5 sm:px-8 lg:justify-end">
          <Link href="/" className="rounded-md lg:hidden" aria-label="Nova Meridian home">
            <Logo />
          </Link>
          <ThemeToggle />
        </header>

        <main id="main" className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-[26rem] animate-fade-up">
            <h1 className="text-h1 !text-[1.875rem]">{title}</h1>
            {description && <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  )
}

export function FullPageSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background" role="status">
      <Loader2 className="size-7 animate-spin text-brand-ink" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
