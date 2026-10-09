import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { MarketingShell } from "@/components/marketing/marketing-shell"
import { PageHero } from "@/components/marketing/page-hero"

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about funding your wallet, plans and rewards, withdrawals, referrals and account security at Nova Meridian.",
}

const GROUPS = [
  {
    title: "Getting started",
    items: [
      {
        q: "How do I join?",
        a: "Registration is by invitation. Sign up with your email and the referral code from an existing member, then verify your address. Once you are in, fund your wallet and choose a plan.",
      },
      {
        q: "How long does deposit verification take?",
        a: "You submit your payment confirmation and our team reviews it. Most deposits are processed within 12–24 hours. Please send exactly the amount you requested, because any excess is not refunded.",
      },
    ],
  },
  {
    title: "Plans and rewards",
    items: [
      {
        q: "How do rewards work?",
        a: "Each plan has a daily reward rate and a duration. You can claim your reward once every 24 hours and it is added to your wallet balance. The terms for each plan are shown before you invest.",
      },
      {
        q: "Are rewards guaranteed?",
        a: "No. Rates describe plan terms, but investing involves risk, including the possible loss of capital. Please review each plan and our Terms of Service before committing funds.",
      },
      {
        q: "Can I invite friends?",
        a: "Yes. Every member has a personal referral code. Referral rewards are paid according to the current referral programme, which you can follow from your profile.",
      },
    ],
  },
  {
    title: "Withdrawals",
    items: [
      {
        q: "How do withdrawals work?",
        a: "You request a withdrawal from your dashboard. Requests are reviewed and, once approved, are typically processed within 12–24 hours to the bank account or mobile wallet you registered. Additional verification may be requested to protect your account.",
      },
    ],
  },
  {
    title: "Security and support",
    items: [
      {
        q: "Is my information protected?",
        a: "Sign-in uses secure authentication over encrypted connections, access is divided by role, and administrative actions are logged. See our Security page for more detail.",
      },
      {
        q: "How can I contact support?",
        a: "Message us on Telegram or through the contact form. We read every message and reply as soon as we can.",
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <MarketingShell>
      <PageHero
        eyebrow="FAQ"
        title="Straight answers to common questions."
        description="Funding, plans, rewards, withdrawals and security, explained without the jargon."
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-4xl space-y-14 px-5 lg:px-8">
          {GROUPS.map((g) => (
            <div key={g.title} className="grid gap-6 md:grid-cols-[200px_1fr] md:gap-10">
              <h2 className="eyebrow pt-6 !text-muted-foreground">{g.title}</h2>
              <Accordion type="single" collapsible className="w-full border-t border-border">
                {g.items.map((f) => (
                  <AccordionItem key={f.q} value={f.q}>
                    <AccordionTrigger>{f.q}</AccordionTrigger>
                    <AccordionContent>{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}

          <div className="rounded-3xl border border-border bg-card p-8 text-center sm:p-10">
            <h2 className="text-h2">Still have a question?</h2>
            <p className="mt-3 text-body">Our team will be glad to help.</p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/contact">Contact us <ArrowRight /></Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
