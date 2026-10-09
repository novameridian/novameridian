import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, FileSearch, KeyRound, LockKeyhole, ScanSearch, UserCheck, Database } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MarketingShell } from "@/components/marketing/marketing-shell"
import { PageHero } from "@/components/marketing/page-hero"
import { Reveal } from "@/components/brand/reveal"

export const metadata: Metadata = {
  title: "Security",
  description:
    "How Nova Meridian protects accounts, verifies money movements and handles personal information.",
}

const PILLARS = [
  {
    icon: LockKeyhole,
    title: "Account security",
    body: "Sign-in is handled by secure authentication, and communication between your device and our servers is encrypted.",
  },
  {
    icon: ScanSearch,
    title: "Verified deposits",
    body: "Every deposit is checked before it is approved and credited, which helps guard against fraudulent payments.",
  },
  {
    icon: KeyRound,
    title: "Separated permissions",
    body: "Members, moderators and administrators have distinct access, so sensitive tools are limited to the people who need them.",
  },
  {
    icon: FileSearch,
    title: "Traceable actions",
    body: "Administrative actions are written to an audit log so that changes to accounts and balances can be traced afterwards.",
  },
  {
    icon: Database,
    title: "Data protection",
    body: "Personal information is stored securely and used only to operate the platform and provide support.",
  },
  {
    icon: UserCheck,
    title: "Your part",
    body: "Keep your password private, never share login details, and tell us right away if you notice anything unusual.",
  },
]

export default function SecurityPage() {
  return (
    <MarketingShell>
      <PageHero
        eyebrow="Security"
        title="Protection that works in layers."
        description="No single control keeps an account safe. Nova Meridian combines secure sign-in, human review of money movements and clear audit trails."
      />

      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p, i) => (
              <li key={p.title}>
                <Reveal delay={(i % 3) * 80} className="h-full">
                  <article className="h-full rounded-3xl border border-border bg-card p-7 transition-colors hover:border-brand/40">
                    <span className="grid size-11 place-items-center rounded-xl border border-border bg-muted text-brand-ink">
                      <p.icon className="size-5" aria-hidden="true" />
                    </span>
                    <h2 className="text-h3 mt-6">{p.title}</h2>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-16">
        <Reveal>
          <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-6 px-5 sm:flex-row sm:items-center lg:px-8">
            <div>
              <h2 className="text-h2">Seen something suspicious?</h2>
              <p className="mt-2 text-body">Report it to our team and we will look into it.</p>
            </div>
            <Button asChild size="lg">
              <Link href="/contact">Contact support <ArrowRight /></Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </MarketingShell>
  )
}
