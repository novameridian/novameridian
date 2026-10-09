import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AuthShell } from '@/components/app/auth-shell'

export const metadata = { title: 'Authentication problem' }

export default function AuthErrorPage() {
  return (
    <AuthShell
      title="We couldn't complete that"
      description="Something went wrong while verifying your request."
    >
      <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-6">
        <span className="grid size-11 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <AlertCircle className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm leading-relaxed text-body">
          The link may have expired or already been used. Please sign in again, or request a new link if
          you need one.
        </p>
      </div>
      <div className="mt-6 grid gap-3">
        <Button asChild size="lg">
          <Link href="/auth/login">Try again</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/contact">Contact support</Link>
        </Button>
      </div>
    </AuthShell>
  )
}
