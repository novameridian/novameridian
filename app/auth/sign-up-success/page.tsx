import Link from 'next/link'
import { ArrowRight, MailCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AuthShell } from '@/components/app/auth-shell'

export const metadata = { title: 'Check your email' }

export default function SignUpSuccessPage() {
  return (
    <AuthShell
      title="Check your email"
      description="We have sent a confirmation link to the address you registered with."
    >
      <div className="rounded-2xl border border-border bg-card p-6">
        <span className="grid size-11 place-items-center rounded-xl bg-brand/12 text-brand-ink">
          <MailCheck className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm leading-relaxed text-body">
          Open the link in that email to verify your account and finish setting up. If it has not arrived
          after a few minutes, check your spam folder.
        </p>
      </div>
      <div className="mt-6 grid gap-3">
        <Button asChild size="lg">
          <Link href="/auth/login">Go to sign in <ArrowRight /></Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </AuthShell>
  )
}
