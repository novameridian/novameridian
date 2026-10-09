import Link from "next/link"
import {
  ArrowRight,
  ClipboardCheck,
  Coins,
  FileSearch,
  LifeBuoy,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  UserPlus,
  Wallet,
  Users,
  Layers,
  LockKeyhole,
  ScanSearch,
  KeyRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { InvestmentPlansDisplay } from "@/components/investment-plans-display"
import { MarketingShell } from "@/components/marketing/marketing-shell"
import { RecoveryRedirect } from "@/components/marketing/recovery-redirect"
import { DashboardPreview } from "@/components/marketing/dashboard-preview"
import { MeridianVisual } from "@/components/brand/meridian-visual"
import { Reveal } from "@/components/brand/reveal"

const PRINCIPLES = [
  { icon: ScrollText, title: "Defined terms", body: "Reward rate, amount range and duration are listed on every plan before you commit." },
  { icon: ReceiptText, title: "Itemised ledger", body: "Deposits, withdrawals, rewards and referrals each appear as their own record." },
  { icon: ClipboardCheck, title: "Reviewed movements", body: "Deposits and withdrawals are checked by our team before they are processed." },
  { icon: LifeBuoy, title: "Reachable support", body: "Talk to us on Telegram or by email whenever you need a hand." },
]

const STEPS = [
  { icon: UserPlus, title: "Join with an invitation", body: "Register with your email and the referral code you were given, then verify your address to activate the account." },
  { icon: Wallet, title: "Fund your wallet", body: "Deposit with CBE or Telebirr and submit your confirmation. Deposits are typically reviewed within 12–24 hours." },
  { icon: Layers, title: "Choose a plan", body: "Compare rates, ranges and durations, then commit an amount within the limits of the plan you pick." },
  { icon: Coins, title: "Track and claim", body: "Claim available rewards every 24 hours, follow your ledger, and request a withdrawal when you are ready." },
]

const PLATFORM_POINTS = [
  { icon: Wallet, title: "One wallet, fully itemised", body: "Your balance, total deposited, total withdrawn and total earned sit together at the top of your dashboard." },
  { icon: Layers, title: "Plans you can follow day by day", body: "See each active plan, what has been earned and when your next claim opens." },
  { icon: Users, title: "Referrals in the same place", body: "Invite others with your personal code and see reward activity alongside everything else." },
]

const SECURITY = [
  { icon: LockKeyhole, title: "Secure sign-in", body: "Authentication runs through an established identity provider, over encrypted connections." },
  { icon: KeyRound, title: "Separated permissions", body: "Member, moderator and administrator access are distinct, so tools are only available to the people who need them." },
  { icon: ScanSearch, title: "Review before release", body: "Deposits and withdrawals are verified by staff before balances change." },
  { icon: FileSearch, title: "An audit trail", body: "Administrative actions are recorded so that changes can be traced." },
]

const FAQS = [
  {
    q: "How do I get started?",
    a: "Create an account, deposit funds with CBE or Telebirr, and choose a plan from the list. The amount range for each plan is shown before you confirm.",
  },
  {
    q: "How are deposits handled?",
    a: "After you send funds, you submit your confirmation and our team reviews it. Most deposits are processed within 12–24 hours. Please send the exact amount you request, as any excess is not refunded.",
  },
  {
    q: "How do rewards work?",
    a: "Each plan has a daily reward rate. You can claim your reward once every 24 hours, and it is added to your wallet balance. The rate, the amount range and the duration are all shown on the plan.",
  },
  {
    q: "How long do withdrawals take?",
    a: "Withdrawals are typically processed within 12–24 hours and sent to the bank account or mobile wallet you registered. The current minimum is shown on the withdrawal screen.",
  },
  {
    q: "Are rewards guaranteed?",
    a: "No. Reward rates are set per plan and apply to the plan you choose, but investing involves risk, including the possible loss of capital. Read each plan and our Terms of Service before you commit funds.",
  },
  {
    q: "How is my account protected?",
    a: "Sign-in uses secure authentication over encrypted connections, access is split by role, and administrative actions are logged. You can help by keeping your password private and reporting anything unusual.",
  },
]

export default function HomePage() {
  return (
    <MarketingShell>
      <RecoveryRedirect />

      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-horizon-glow animate-drift" />
        <div className="pointer-events-none absolute inset-0 bg-meridian-grid" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8 lg:pb-28 lg:pt-24">
          <div>
            <p className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-border bg-card/70 py-1.5 pl-2 pr-3.5 text-xs font-medium text-body backdrop-blur">
              <span className="grid size-5 place-items-center rounded-full bg-brand/15">
                <span className="size-1.5 rounded-full bg-brand" />
              </span>
              Investment platform · ETB · CBE &amp; Telebirr
            </p>

            <h1 className="text-display mt-7 animate-fade-up [animation-delay:80ms]">
              A New <span className="text-gradient">Direction</span>
              <br />
              for Your Financial Future.
            </h1>

            <p className="mt-6 max-w-xl animate-fade-up text-lg leading-relaxed text-body [animation-delay:160ms]">
              Nova Meridian brings clearly defined investment plans, a transparent wallet and
              real-time tracking into a single account, so you always know where you stand.
            </p>

            <div className="mt-9 flex animate-fade-up flex-col gap-3 sm:flex-row [animation-delay:240ms]">
              <Button asChild size="lg" variant="brand">
                <Link href="/auth/sign-up">
                  Open an account <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#plans">Explore plans</Link>
              </Button>
            </div>

            <ul className="mt-12 grid animate-fade-up gap-3 text-sm text-body sm:grid-cols-3 sm:gap-6 [animation-delay:320ms]">
              {["Terms shown before you commit", "Every movement in your ledger", "Deposits and withdrawals reviewed"].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-ink" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <MeridianVisual />
          </div>
        </div>
      </section>

      {/* ───────── Principles ───────── */}
      <section aria-label="What to expect" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border">
            {PRINCIPLES.map((p, i) => (
              <li key={p.title} className="lg:px-8 lg:first:pl-0 lg:last:pr-0">
                <Reveal delay={i * 70}>
                  <p.icon className="size-5 text-brand-ink" aria-hidden="true" />
                  <h2 className="text-h3 mt-4">{p.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── Platform ───────── */}
      <section id="platform" className="scroll-mt-20 py-24 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:gap-20 lg:px-8">
          <Reveal>
            <p className="eyebrow">The platform</p>
            <h2 className="text-h1 mt-4">Your whole position, in one view.</h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-body">
              Nova Meridian is built around a simple idea: you should be able to see exactly what
              you hold, what you have earned and what happens next, without hunting for it.
            </p>
            <ul className="mt-10 space-y-7">
              {PLATFORM_POINTS.map((p) => (
                <li key={p.title} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-brand-ink">
                    <p.icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-h3">{p.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <DashboardPreview />
          </Reveal>
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section id="how" className="scroll-mt-20 border-y border-border bg-surface py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">How it works</p>
            <h2 className="text-h1 mt-4">Four steps from sign-up to your first claim.</h2>
          </Reveal>
          <ol className="relative mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <div className="pointer-events-none absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-brand/60 via-brand-2/40 to-transparent lg:block" aria-hidden="true" />
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <Reveal delay={i * 90}>
                  <div className="relative grid size-10 place-items-center rounded-full border border-border bg-background text-brand-ink shadow-xs">
                    <s.icon className="size-[18px]" aria-hidden="true" />
                  </div>
                  <p className="num mt-6 text-xs font-semibold tracking-[0.14em] text-muted-foreground">STEP 0{i + 1}</p>
                  <h3 className="text-h3 mt-2">{s.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── Plans ───────── */}
      <section id="plans" className="relative scroll-mt-20 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Investment plans</p>
            <h2 className="text-h1 mt-4">Plans with the terms up front.</h2>
            <p className="mt-5 text-lg leading-relaxed text-body">
              Every plan lists its reward rate, amount range and duration. Rates and availability are
              set per plan and can change, so review the details before you invest.
            </p>
          </Reveal>
          <InvestmentPlansDisplay />
          <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Investing involves risk, including the possible loss of capital. Reward rates describe plan
            terms and are not a guarantee of any outcome.
          </p>
        </div>
      </section>

      {/* ───────── Security (always-dark band) ───────── */}
      <section id="security" className="dark relative scroll-mt-20 overflow-hidden bg-background py-24 text-foreground lg:py-32">
        <div className="pointer-events-none absolute inset-0 bg-horizon-glow" />
        <div className="pointer-events-none absolute inset-0 bg-meridian-grid opacity-80" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8">
          <Reveal>
            <p className="eyebrow">Security &amp; technology</p>
            <h2 className="text-h1 mt-4">Built to be checked, not just trusted.</h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-body">
              Controls are layered through the product: how you sign in, who can see what, and how money moves.
            </p>
            <Button asChild variant="outline" size="lg" className="mt-8">
              <Link href="/security">
                Read about security <ArrowRight />
              </Link>
            </Button>
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-2">
            {SECURITY.map((s, i) => (
              <li key={s.title}>
                <Reveal delay={i * 80} className="h-full">
                  <div className="h-full rounded-2xl border border-border bg-card/80 p-6 backdrop-blur">
                    <s.icon className="size-5 text-brand" aria-hidden="true" />
                    <h3 className="text-h3 mt-4">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section id="faq" className="scroll-mt-20 py-24 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-8">
          <Reveal>
            <p className="eyebrow">Questions</p>
            <h2 className="text-h1 mt-4">Straight answers.</h2>
            <p className="mt-5 max-w-sm text-body">
              The essentials on funding, rewards and withdrawals. For anything else, we are one message away.
            </p>
            <Button asChild variant="link" className="mt-4 -ml-2 px-2">
              <Link href="/contact">Contact the team <ArrowRight /></Link>
            </Button>
          </Reveal>
          <Reveal delay={100}>
            <Accordion type="single" collapsible className="w-full border-t border-border">
              {FAQS.map((f, i) => (
                <AccordionItem key={f.q} value={`item-${i}`}>
                  <AccordionTrigger>{f.q}</AccordionTrigger>
                  <AccordionContent>{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section className="px-5 pb-24 lg:px-8 lg:pb-32">
        <Reveal>
          <div className="dark relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-border bg-background px-6 py-16 text-center text-foreground sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute inset-0 bg-horizon-glow" />
            <div className="pointer-events-none absolute inset-0 bg-meridian-grid opacity-80" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-h1">Start with a clear view.</h2>
              <p className="mt-5 text-lg leading-relaxed text-body">
                Open an account, look through the plans, and decide at your own pace.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" variant="brand">
                  <Link href="/auth/sign-up">Open an account <ArrowRight /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/auth/login">Sign in</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </MarketingShell>
  )
}
