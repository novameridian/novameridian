"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/brand/logo"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[NovaMeridian] Unhandled error:", error)
  }, [error])

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-5 text-center">
      <div className="pointer-events-none absolute inset-0 bg-horizon-glow" />
      <Logo className="relative mb-10" />
      <span className="relative grid size-14 place-items-center rounded-2xl border border-border bg-card text-warning shadow-md">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>
      <h1 className="text-h1 relative mt-6">Something went wrong.</h1>
      <p className="relative mt-3 max-w-md text-body" role="alert">
        An unexpected error interrupted this page. Your account and funds are not affected. Please try again.
      </p>
      <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>Try again</Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  )
}
