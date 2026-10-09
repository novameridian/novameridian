'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowRight, CalendarClock, Layers, Percent } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Reveal } from '@/components/brand/reveal'

interface InvestmentPlan {
  id: string
  name: string
  description: string
  min_amount: number
  max_amount: number
  daily_reward_percentage: number
  duration_days: number
  is_active: boolean
  created_at: string
}

const NO_LIMIT = 999999999

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', { maximumFractionDigits: 2 }).format(n)

export function InvestmentPlansDisplay() {
  const [plans, setPlans] = useState<InvestmentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchActivePlans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchActivePlans() {
    try {
      const { data, error } = await supabase
        .from('investment_plans')
        .select('id, name, description, min_amount, max_amount, daily_reward_percentage, duration_days, is_active, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[NovaMeridian] Error fetching plans:', error)
        setFailed(true)
      } else {
        setPlans(data || [])
      }
    } catch (error) {
      console.error('[NovaMeridian] Error:', error)
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading investment plans</span>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[26rem] rounded-3xl" />
        ))}
      </div>
    )
  }

  if (failed || plans.length === 0) {
    return (
      <div className="mt-12 rounded-3xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
        <Layers className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-h3 mt-4">
          {failed ? 'Plans are temporarily unavailable' : 'No plans are open right now'}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {failed
            ? 'We could not load plan details. Please refresh the page or try again in a few minutes.'
            : 'New plans are published here as they open. Create an account to be ready when one does.'}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan, index) => {
        const unlimited = plan.max_amount >= NO_LIMIT
        const minDaily = (plan.min_amount * plan.daily_reward_percentage) / 100
        return (
          <Reveal key={plan.id} delay={index * 80} className="h-full">
            <article
              data-interactive
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-xs transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-md"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-brand/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

              <header className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Plan {String(index + 1).padStart(2, '0')}</p>
                  <h3 className="text-h2 mt-3">{plan.name}</h3>
                </div>
                <span className="grid size-10 place-items-center rounded-xl border border-border bg-muted text-brand-ink">
                  <Percent className="size-4" aria-hidden="true" />
                </span>
              </header>

              <div className="relative mt-7">
                <p className="text-xs font-medium text-muted-foreground">Daily reward rate</p>
                <p className="num mt-1 font-display text-5xl font-semibold tracking-tight">
                  {plan.daily_reward_percentage}
                  <span className="ml-0.5 text-2xl text-muted-foreground">%</span>
                </p>
              </div>

              <dl className="relative mt-7 divide-y divide-border border-y border-border text-sm">
                <div className="flex items-center justify-between py-3">
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="num text-right font-medium">
                    ETB {fmt(plan.min_amount)}
                    <span className="text-muted-foreground"> – </span>
                    {unlimited ? 'No upper limit' : fmt(plan.max_amount)}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-3">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarClock className="size-3.5" aria-hidden="true" /> Duration
                  </dt>
                  <dd className="num font-medium">{plan.duration_days} days</dd>
                </div>
                <div className="flex items-center justify-between py-3">
                  <dt className="text-muted-foreground">Reward at minimum</dt>
                  <dd className="num font-medium">ETB {fmt(minDaily)} / day</dd>
                </div>
              </dl>

              {plan.description && (
                <p className="relative mt-5 flex-1 text-sm leading-relaxed text-body">{plan.description}</p>
              )}
              {!plan.description && <div className="flex-1" />}

              <Button asChild variant="outline" size="lg" className="relative mt-7 w-full group-hover:border-brand/50">
                <Link href="/auth/login" aria-label={`View ${plan.name} plan and get started`}>
                  Get started <ArrowRight />
                </Link>
              </Button>
            </article>
          </Reveal>
        )
      })}
    </div>
  )
}
