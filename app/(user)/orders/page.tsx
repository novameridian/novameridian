'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { PageHeader, EmptyState } from '@/components/app/page-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Gift, Clock, CheckCircle2, AlertCircle, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

type Order = {
  id: string
  plan_id: string
  amount: number
  daily_reward: number
  total_earned: number
  start_date: string
  end_date: string
  next_claim_at: string
  is_active: boolean
  is_completed: boolean
  investment_plans: {
    name: string
    daily_reward_percentage: number
    duration_days: number
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  const fetchOrders = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: ordersData } = await supabase
      .from('orders')
      .select(`
        *,
        investment_plans (
          name,
          daily_reward_percentage,
          duration_days
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (ordersData) {
      setOrders(ordersData)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [router])

  const canClaim = (order: Order) => {
    const now = new Date()
    const nextClaim = new Date(order.next_claim_at)
    return now >= nextClaim && order.is_active && !order.is_completed
  }

  const getTimeUntilClaim = (order: Order) => {
    const now = new Date()
    const nextClaim = new Date(order.next_claim_at)
    const diff = nextClaim.getTime() - now.getTime()
    
    if (diff <= 0) return null
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getDaysRemaining = (order: Order) => {
    const now = new Date()
    const endDate = new Date(order.end_date)
    const diff = endDate.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const handleClaimReward = async (order: Order) => {
    if (!canClaim(order)) return
    
    setClaimingId(order.id)
    setError(null)
    setSuccessMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get current wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance, total_earned')
        .eq('user_id', user.id)
        .single()

      if (!wallet) throw new Error('Wallet not found')

      // Calculate next claim time (24 hours from now)
      const nextClaimAt = new Date()
      nextClaimAt.setHours(nextClaimAt.getHours() + 24)

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: wallet.balance + order.daily_reward,
          total_earned: wallet.total_earned + order.daily_reward,
        })
        .eq('user_id', user.id)

      if (walletError) throw walletError

      // Update order
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          total_earned: order.total_earned + order.daily_reward,
          next_claim_at: nextClaimAt.toISOString(),
        })
        .eq('id', order.id)

      if (orderError) throw orderError

      // Create reward record
      await supabase
        .from('rewards')
        .insert({
          user_id: user.id,
          order_id: order.id,
          amount: order.daily_reward,
        })

      // Create transaction record
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'reward',
          amount: order.daily_reward,
          balance_before: wallet.balance,
          balance_after: wallet.balance + order.daily_reward,
          reference_id: order.id,
          description: `Daily reward from ${order.investment_plans.name} plan`,
          status: 'completed',
        })

      setSuccessMessage(`Claimed ETB ${order.daily_reward.toLocaleString()} reward!`)
      
      // Refresh orders
      await fetchOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim reward')
    } finally {
      setClaimingId(null)
    }
  }

  // Timer effect for countdown
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading your investments</span>
        <Skeleton className="h-9 w-56" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Investments"
        title="Your active plans"
        description="Track each plan, see what it has earned and claim rewards when they become available."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Browse plans</Link>
          </Button>
        }
      />

      {successMessage && (
        <Alert variant="success" className="mb-5" role="status">
          <CheckCircle2 />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {orders.length === 0 ? (
        <EmptyState
          icon={<Layers className="size-5" aria-hidden="true" />}
          title="No active investments yet"
          description="When you invest in a plan it will appear here, along with its claim schedule."
          action={
            <Button asChild>
              <Link href="/dashboard">See available plans</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {orders.map((order) => {
            const timeUntilClaim = getTimeUntilClaim(order)
            const daysRemaining = getDaysRemaining(order)
            const canClaimNow = canClaim(order)
            const duration = order.investment_plans.duration_days || 0
            const progress = duration > 0 ? Math.min(100, Math.max(0, ((duration - daysRemaining) / duration) * 100)) : 0

            return (
              <article key={order.id} className="flex flex-col rounded-3xl border border-border bg-card p-6">
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-h3 !text-xl">{order.investment_plans.name}</h2>
                    <p className="num mt-1 text-sm text-muted-foreground">
                      ETB {order.amount.toLocaleString()} invested
                    </p>
                  </div>
                  <Badge variant={order.is_active ? 'success' : 'secondary'}>
                    {order.is_active ? 'Active' : 'Completed'}
                  </Badge>
                </header>

                <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Daily reward rate</dt>
                    <dd className="num mt-1 font-semibold">{order.investment_plans.daily_reward_percentage.toLocaleString()}%</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Total earned</dt>
                    <dd className="num mt-1 font-semibold text-success">ETB {order.total_earned.toLocaleString()}</dd>
                  </div>
                </dl>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Term progress</span>
                    <span className="num">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining</span>
                  </div>
                  <Progress value={progress} aria-label={`${order.investment_plans.name} term progress`} />
                </div>

                {order.is_active && (
                  <div className="mt-6 border-t border-border pt-5">
                    {canClaimNow ? (
                      <Button
                        size="lg"
                        variant="brand"
                        className="w-full"
                        onClick={() => handleClaimReward(order)}
                        loading={claimingId === order.id}
                      >
                        {claimingId !== order.id && <Gift />}
                        {claimingId === order.id ? 'Claiming…' : 'Claim reward'}
                      </Button>
                    ) : (
                      <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted px-4 py-3.5">
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="size-4" aria-hidden="true" /> Next claim in
                        </span>
                        <span role="timer" className="num font-mono text-sm font-semibold">{timeUntilClaim}</span>
                      </div>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
