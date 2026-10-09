export const dynamic = 'force-dynamic';

import { Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/brand/logo"
import { SITE_NAME, TELEGRAM_URL } from "@/lib/site"

async function getSettings() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL

    const res = await fetch(`${baseUrl}/api/settings`, {
      cache: "no-store",
    })

    if (!res.ok) return null

    return await res.json()
  } catch (err) {
    console.error("settings fetch failed:", err)
    return null
  }
}

export const metadata = {
  title: "Scheduled maintenance",
  robots: { index: false, follow: false },
}

export default async function MaintenancePage() {
  const data = await getSettings()

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-horizon-glow" />
      <div className="pointer-events-none absolute inset-0 bg-meridian-grid" />

      <header className="relative">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Logo />
          <ThemeToggle />
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-xl text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-border bg-card text-brand-ink shadow-md">
            <Wrench className="size-6" aria-hidden="true" />
          </span>

          <p className="eyebrow mt-8">Scheduled maintenance</p>
          <h1 className="text-h1 mt-4">We are making improvements.</h1>

          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-body" role="status">
            {data?.maintenance_message ||
              "System updates are in progress. Please check back shortly."}
          </p>

          <div className="mt-9 flex justify-center">
            <Button asChild size="lg" variant="outline">
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                Contact support on Telegram
              </a>
            </Button>
          </div>

          <p className="mt-10 text-xs text-muted-foreground">
            You are seeing this page because maintenance mode is active on {SITE_NAME}.
          </p>
        </div>
      </main>
    </div>
  )
}
