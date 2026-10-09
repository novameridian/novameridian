'use client'

import React from "react"

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/app/page-header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle, CheckCircle2, CalendarClock, Percent, Wallet } from 'lucide-react'

type InvestmentPlan = {
  id: string
  name: string
  description: string
  min_amount: number
  max_amount: number
  duration_days: number
  daily_reward_percentage: number
}

export default function InvestPage() {
  const params = useParams()
  const planId = params.planId as string
  const [plan, setPlan] = useState<InvestmentPlan | null>(null)
  const [amount, setAmount] = useState('')
  const [walletBalance, setWalletBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch plan
      const { data: planData } = await supabase
        .from('investment_plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (planData) {
        setPlan(planData)
        setAmount(planData.min_amount.toString())
      }

      // Fetch wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single()

      if (wallet) {
        setWalletBalance(wallet.balance)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [planId, router])

  const calculateDailyReward = () => {
    if (!plan || !amount) return 0
    return (parseFloat(amount) * plan.daily_reward_percentage) / 100
  }

  const calculateTotalReturn = () => {
    if (!plan || !amount) return 0
    const amountNum = parseFloat(amount)
    return (amountNum * plan.daily_reward_percentage) / 100 * plan.duration_days
  }

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!plan) return

    const amountNum = parseFloat(amount)
    
    if (isNaN(amountNum) || amountNum < plan.min_amount) {
      setError(`Minimum investment is ETB ${plan.min_amount.toLocaleString()}`)
      return
    }

    if (plan.max_amount < 999999999 && amountNum > plan.max_amount) {
      setError(`Maximum investment for this plan is ETB ${plan.max_amount.toLocaleString()}`)
      return
    }

    if (amountNum > walletBalance) {
      setError('Insufficient wallet balance. Please deposit funds first.')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const endDate = new Date()
      endDate.setDate(endDate.getDate() + plan.duration_days)

      const dailyReward = (amountNum * plan.daily_reward_percentage) / 100

      // Create order
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          amount: amountNum,
          daily_reward: dailyReward,
          end_date: endDate.toISOString(),
          next_claim_at: new Date().toISOString(),
        })

      if (orderError) throw orderError

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: walletBalance - amountNum,
        })
        .eq('user_id', user.id)

      if (walletError) throw walletError

      // Create transaction record
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'investment',
          amount: amountNum,
          balance_before: walletBalance,
          balance_after: walletBalance - amountNum,
          description: `Investment in ${plan.name} plan`,
          status: 'completed',
        })

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create investment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const money = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (isLoading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading plan</span>
        <Skeleton className="h-9 w-56" />
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="size-5" aria-hidden="true" />
        </span>
        <h1 className="text-h3 mt-5">Plan not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This plan may have been closed or the link may be out of date.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Back to overview</Link>
        </Button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 text-center animate-fade-up" role="status">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h1 className="text-h2 mt-6">Investment confirmed</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          ETB {parseFloat(amount).toLocaleString()} has been placed in the {plan.name} plan. You can claim
          rewards from your investments page once they become available.
        </p>
        <div className="mt-7 grid gap-3">
          <Button asChild size="lg">
            <Link href="/orders">View my investments</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard">Back to overview</Link>
          </Button>
        </div>
      </div>
    )
  }

  const amountNum = parseFloat(amount)
  const hasAmount = !!amount && amountNum > 0

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link href="/dashboard"><ArrowLeft /> Overview</Link>
      </Button>

      <PageHeader eyebrow="New investment" title={plan.name} description={plan.description} />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        {/* Plan terms */}
        <section aria-labelledby="terms-heading" className="rounded-3xl border border-border bg-card p-6 sm:p-7">
          <h2 id="terms-heading" className="text-h3">Plan terms</h2>
          <dl className="mt-5 divide-y divide-border text-sm">
            <div className="flex items-center justify-between py-3.5">
              <dt className="flex items-center gap-2 text-muted-foreground"><Percent className="size-4" aria-hidden="true" /> Daily reward rate</dt>
              <dd className="num font-semibold text-brand-ink">{plan.daily_reward_percentage}%</dd>
            </div>
            <div className="flex items-center justify-between py-3.5">
              <dt className="flex items-center gap-2 text-muted-foreground"><CalendarClock className="size-4" aria-hidden="true" /> Duration</dt>
              <dd className="num font-semibold">{plan.duration_days} days</dd>
            </div>
            <div className="flex items-center justify-between py-3.5">
              <dt className="text-muted-foreground">Minimum</dt>
              <dd className="num font-semibold">ETB {plan.min_amount.toLocaleString()}</dd>
            </div>
            <div className="flex items-center justify-between py-3.5">
              <dt className="text-muted-foreground">Maximum</dt>
              <dd className="num font-semibold">
                {plan.max_amount >= 999999999 ? 'No limit' : `ETB ${plan.max_amount.toLocaleString()}`}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-muted p-4">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="size-4" aria-hidden="true" /> Available balance
            </span>
            <span className="num font-display text-lg font-semibold">ETB {walletBalance.toLocaleString()}</span>
          </div>
        </section>

        {/* Form */}
        <section aria-labelledby="amount-heading" className="rounded-3xl border border-border bg-card p-6 sm:p-7">
          <h2 id="amount-heading" className="text-h3">Investment amount</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Between ETB {plan.min_amount.toLocaleString()} and{' '}
            {plan.max_amount >= 999999999 ? 'no upper limit' : `ETB ${plan.max_amount.toLocaleString()}`}.
          </p>

          <form onSubmit={handleInvest} className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (ETB)</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                placeholder="Enter an amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={plan.min_amount}
                max={plan.max_amount >= 999999999 ? undefined : plan.max_amount}
                required
                className="num h-12 text-lg"
              />
            </div>

            {hasAmount && (
              <div className="rounded-2xl border border-border bg-muted/60 p-4 text-sm" aria-live="polite">
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Reward per day</span>
                  <span className="num font-medium">ETB {money(calculateDailyReward())}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="num font-medium">{plan.duration_days} days</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-border pt-3">
                  <span className="text-muted-foreground">Plan rewards over the term</span>
                  <span className="num font-display font-semibold">ETB {money(calculateTotalReturn())}</span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Based on the plan rate applied to the amount above and claimed every day. This is an
                  illustration of plan terms, not a guarantee.
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              {isSubmitting ? 'Processing…' : 'Confirm investment'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  )
}
