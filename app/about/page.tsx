import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MarketingShell } from "@/components/marketing/marketing-shell"
import { PageHero } from "@/components/marketing/page-hero"
import { Reveal } from "@/components/brand/reveal"

export const metadata: Metadata = {
  title: "About",
  description:
    "Nova Meridian is an investment platform built around clear plan terms, a transparent ledger and careful handling of money movements.",
}

const PRINCIPLES = [
  {
    n: "01",
    title: "Clarity before commitment",
    body: "Every plan states its reward rate, amount range and duration in plain terms. You should never need to read between the lines to understand what you are choosing.",
  },
  {
    n: "02",
    title: "A ledger you can follow",
    body: "Deposits, withdrawals, rewards and referral activity are recorded as individual entries, so your balance always has an explanation.",
  },
  {
    n: "03",
    title: "Care with every movement",
    body: "Money in and out of your wallet is reviewed by people, not just processed by software. It takes a little longer, and it is deliberate.",
  },
]

const CAPABILITIES = [
  "Fund your wallet with CBE or Telebirr",
  "Compare plans and invest within their stated limits",
  "Claim available rewards every 24 hours",
  "Follow orders and transactions in one place",
  "Invite others with your personal referral code",
  "Reach support through Telegram or email",
]

export default function AboutPage() {
  return (
    <MarketingShell>
      <PageHero
        eyebrow="About Nova Meridian"
        title="A clearer way to put money to work."
        description="A meridian is a fixed line used to find your position and plan a direction. We built Nova Meridian to give investors the same thing: a clear view of where they stand and what comes next."
      />

      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">How we work</p>
            <h2 className="text-h1 mt-4">Three ideas guide the product.</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.n} delay={i * 90} className="h-full">
                <article className="h-full rounded-3xl border border-border bg-card p-8">
                  <p className="num font-display text-sm font-semibold text-brand-ink">{p.n}</p>
                  <h3 className="text-h2 mt-6 !text-xl">{p.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[1fr_1fr] lg:gap-20 lg:px-8">
          <Reveal>
            <p className="eyebrow">What you can do</p>
            <h2 className="text-h1 mt-4">Everything in one account.</h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-body">
              Nova Meridian keeps the essentials together so that managing your plans feels
              straightforward rather than scattered.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <ul className="divide-y divide-border rounded-3xl border border-border bg-card">
              {CAPABILITIES.map((c) => (
                <li key={c} className="flex items-center gap-4 px-6 py-4 text-[15px]">
                  <span className="size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  {c}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="py-20 lg:py-24">
        <Reveal>
          <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
            <h2 className="text-h1">A note on risk.</h2>
            <p className="mt-5 text-lg leading-relaxed text-body">
              Investing carries risk, including the possible loss of capital. We describe plan terms as
              accurately as we can, but we do not promise outcomes. Please read each plan and our Terms
              of Service, and invest only what you are prepared to commit.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/auth/sign-up">Open an account <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/terms">Read the terms</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </MarketingShell>
  )
}
