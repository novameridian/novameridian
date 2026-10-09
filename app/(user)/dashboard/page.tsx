'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Eye,
  EyeOff,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRight,
  Layers,
  CalendarClock,
  TrendingUp,
} from 'lucide-react'
import { PageHeader, EmptyState } from '@/components/app/page-header'
import { CountUp } from '@/components/brand/count-up'

type Wallet = {
  balance: number
  total_deposited: number
  total_withdrawn: number
  total_earned: number
}

type InvestmentPlan = {
  id: string
  name: string
  description: string
  min_amount: number
  max_amount: number
  duration_days: number
  daily_reward_percentage: number
}

export default function DashboardPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [plans, setPlans] = useState<InvestmentPlan[]>([])
  const [showBalance, setShowBalance] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch wallet
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (walletData) {
        setWallet(walletData)
      }

      // Fetch investment plans
      const { data: plansData } = await supabase
        .from('investment_plans')
        .select('*')
        .eq('is_active', true)
        .order('min_amount', { ascending: true })

      if (plansData) {
        setPlans(plansData)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [router])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading your dashboard</span>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-8 h-60 rounded-3xl" />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Total deposited', value: wallet?.total_deposited || 0, icon: ArrowDownToLine, tone: 'text-foreground' },
    { label: 'Total withdrawn', value: wallet?.total_withdrawn || 0, icon: ArrowUpFromLine, tone: 'text-foreground' },
    { label: 'Total earned', value: wallet?.total_earned || 0, icon: TrendingUp, tone: 'text-success' },
  ]

  return (
    <div>
      <PageHeader eyebrow="Overview" title="Your wallet" description="Balance, activity and the plans currently open for investment." />

      {/* Balance */}
      <section
        aria-label="Wallet balance"
        className="dark relative overflow-hidden rounded-3xl border border-border bg-card p-6 text-foreground shadow-lg sm:p-8"
      >
        <div className="pointer-events-none absolute inset-0 bg-horizon-glow" />
        <div className="pointer-events-none absolute inset-0 bg-meridian-grid opacity-70" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Available balance</p>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowBalance(!showBalance)}
              aria-label={showBalance ? 'Hide balances' : 'Show balances'}
              aria-pressed={!showBalance}
            >
              {showBalance ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </Button>
          </div>

          <p className="num mt-3 flex items-baseline gap-2.5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            <span className="text-lg font-medium text-muted-foreground sm:text-xl">ETB</span>
            {showBalance ? (
              <CountUp value={wallet?.balance || 0} format={formatCurrency} />
            ) : (
              <span aria-label="Balance hidden">••••••••</span>
            )}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:max-w-sm">
            <Button asChild size="lg" variant="brand">
              <Link href="/deposit"><ArrowDownToLine /> Deposit</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/withdraw"><ArrowUpFromLine /> Withdraw</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Totals */}
      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        {stats.map((st) => (
          <div key={st.label} className="rounded-2xl border border-border bg-card p-5">
            <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <st.icon className="size-3.5" aria-hidden="true" />
              {st.label}
            </dt>
            <dd className={`num mt-3 font-display text-xl font-semibold ${st.tone}`}>
              <span className="mr-1 text-xs font-medium text-muted-foreground">ETB</span>
              {showBalance ? formatCurrency(st.value) : '••••'}
            </dd>
          </div>
        ))}
      </dl>

      {/* Plans */}
      <section aria-labelledby="plans-heading" className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 id="plans-heading" className="text-h3">Plans open for investment</h2>
            <p className="mt-1 text-sm text-muted-foreground">Review the terms, then choose an amount within the plan limits.</p>
          </div>
        </div>

        {plans.length === 0 ? (
          <EmptyState
            icon={<Layers className="size-5" aria-hidden="true" />}
            title="No plans are open right now"
            description="New plans appear here as soon as they are published. Check back soon."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => (
              <article
                key={plan.id}
                data-interactive
                className="group flex flex-col rounded-3xl border border-border bg-card p-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-h3 !text-xl">{plan.name}</h3>
                    {plan.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="num font-display text-3xl font-semibold leading-none text-brand-ink">
                      {plan.daily_reward_percentage}<span className="text-lg">%</span>
                    </p>
                    <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">daily reward</p>
                  </div>
                </div>

                <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Minimum</dt>
                    <dd className="num mt-1 font-medium">ETB {formatCurrency(plan.min_amount)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Maximum</dt>
                    <dd className="num mt-1 font-medium">
                      {plan.max_amount >= 999999999 ? 'No limit' : `ETB ${formatCurrency(plan.max_amount)}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarClock className="size-3" aria-hidden="true" /> Duration
                    </dt>
                    <dd className="num mt-1 font-medium">{plan.duration_days} days</dd>
                  </div>
                </dl>

                <Button asChild variant="outline" className="mt-6 w-full group-hover:border-brand/50">
                  <Link href={`/invest/${plan.id}`} aria-label={`Invest in ${plan.name}`}>
                    Invest <ArrowRight />
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
