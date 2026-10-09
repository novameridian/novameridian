import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MarketingShell } from "@/components/marketing/marketing-shell"

export const metadata = { title: "Page not found" }

export default function NotFound() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-horizon-glow" />
        <div className="pointer-events-none absolute inset-0 bg-meridian-grid" />
        <div className="relative mx-auto flex min-h-[60svh] max-w-2xl flex-col items-center justify-center px-5 py-24 text-center">
          <p className="num font-display text-7xl font-semibold tracking-tight text-gradient sm:text-8xl">404</p>
          <h1 className="text-h1 mt-6">We can&apos;t find that page.</h1>
          <p className="mt-4 text-body">
            The address may be mistyped, or the page may have moved. Let&apos;s get you back on course.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/">Go to home <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Contact support</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
