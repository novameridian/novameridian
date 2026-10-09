'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader, EmptyState } from '@/components/app/page-header'
import { Badge } from '@/components/ui/badge'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  Gift,
  Settings,
  Receipt
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Transaction = {
  id: string
  type: 'deposit' | 'withdrawal' | 'investment' | 'reward' | 'adjustment'
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  description: string | null
  created_at: string
}

const typeConfig = {
  deposit: {
    icon: ArrowDownToLine,
    label: 'Deposit',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  withdrawal: {
    icon: ArrowUpFromLine,
    label: 'Withdrawal',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  investment: {
    icon: TrendingUp,
    label: 'Investment',
    color: 'text-brand-ink',
    bgColor: 'bg-brand/10',
  },
  reward: {
    icon: Gift,
    label: 'Reward',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  adjustment: {
    icon: Settings,
    label: 'Adjustment',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
}

const statusConfig = {
  pending: { label: 'Pending', variant: 'warning' as const },
  approved: { label: 'Approved', variant: 'success' as const },
  rejected: { label: 'Rejected', variant: 'destructive' as const },
  completed: { label: 'Completed', variant: 'success' as const },
  cancelled: { label: 'Cancelled', variant: 'secondary' as const },
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchTransactions = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (transactionsData) {
        setTransactions(transactionsData)
      }
      setIsLoading(false)
    }

    fetchTransactions()
  }, [router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading transactions</span>
        <Skeleton className="h-9 w-48" />
        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[4.5rem] rounded-2xl" />)}
        </div>
      </div>
    )
  }

  const rows = transactions.map((transaction) => {
    const config = typeConfig[transaction.type] ?? {
      icon: Receipt,
      label: transaction.type,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    }
    const status = statusConfig[transaction.status] ?? {
      label: transaction.status,
      variant: "secondary" as const,
    }
    const isPositive = ['deposit', 'reward', 'referral_reward'].includes(transaction.type)
    return { transaction, config, status, isPositive, Icon: config.icon }
  })

  return (
    <div>
      <PageHeader
        eyebrow="Ledger"
        title="Transactions"
        description="Your most recent 50 movements, newest first."
      />

      {transactions.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-5" aria-hidden="true" />}
          title="No transactions yet"
          description="Deposits, withdrawals, investments and rewards will be listed here as they happen."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-3xl border border-border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ transaction, config, status, isPositive, Icon }) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="pl-6">
                      <span className="flex items-center gap-3 font-medium">
                        <span className={cn('grid size-8 place-items-center rounded-lg', config.bgColor)}>
                          <Icon className={cn('size-4', config.color)} aria-hidden="true" />
                        </span>
                        {config.label}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[18rem] truncate text-muted-foreground">
                      {transaction.description || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(transaction.created_at)}</TableCell>
                    <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                    <TableCell className={cn('pr-6 text-right font-semibold', isPositive && 'text-success')}>
                      {isPositive ? '+' : '−'} ETB {transaction.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile list */}
          <ul className="space-y-3 md:hidden">
            {rows.map(({ transaction, config, status, isPositive, Icon }) => (
              <li key={transaction.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', config.bgColor)}>
                    <Icon className={cn('size-[18px]', config.color)} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{config.label}</p>
                      <p className={cn('num shrink-0 font-semibold', isPositive && 'text-success')}>
                        {isPositive ? '+' : '−'} ETB {transaction.amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-muted-foreground">
                        {transaction.description || formatDate(transaction.created_at)}
                      </p>
                      <Badge variant={status.variant} className="shrink-0">{status.label}</Badge>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
