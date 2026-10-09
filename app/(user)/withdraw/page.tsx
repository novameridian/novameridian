'use client'

import React from "react"

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/app/page-header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  AlertCircle, 
  CheckCircle2, 
  Building2,
  Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'

type PaymentMethod = 'cbe' | 'telebirr' | null

export default function WithdrawPage() {
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [accountDetails, setAccountDetails] = useState('')
  const [walletBalance, setWalletBalance] = useState(0)
  const [availableWithdrawal, setAvailableWithdrawal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const MIN_WITHDRAWAL = 200

  useEffect(() => {
    const fetchWallet = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance, total_earned, total_withdrawn')
        .eq('user_id', user.id)
        .single()

      if (wallet) {
        setWalletBalance(wallet.balance)

        setAvailableWithdrawal(
          (wallet.total_earned ?? 0) -
          (wallet.total_withdrawn ?? 0)
        )
      }
      setIsLoading(false)
    }

    fetchWallet()
  }, [router])

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal amount is ETB ${MIN_WITHDRAWAL.toLocaleString()}`)
      return
    }
    
    if (amountNum > availableWithdrawal) {
      setError('Insufficient balance')
      return
    }
    
    setStep(2)
  }

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method)
    setStep(3)
  }

  const handleAccountDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!accountDetails.trim()) {
      setError('Please enter your account details')
      return
    }
    
    setStep(4)
  }

  const handleSubmitWithdrawal = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const withdrawalAmount = parseFloat(amount)

      // First, verify and deduct from wallet balance
      const { data: wallet, error: walletFetchError } = await supabase
        .from('wallets')
        .select('balance, total_earned, total_withdrawn')
        .eq('user_id', user.id)
        .single()

      if (walletFetchError || !wallet) {
        throw new Error('Failed to verify wallet balance')
      }

      const availableWithdrawal =
        (wallet.total_earned ?? 0) -
        (wallet.total_withdrawn ?? 0)

      if (withdrawalAmount > availableWithdrawal) {
        throw new Error('Insufficient withdrawable profit')
      }

      // Deduct balance first (will be refunded if withdrawal is rejected)
      const newBalance = wallet.balance - withdrawalAmount
      const newTotalWithdrawn =
        (wallet.total_withdrawn ?? 0) + withdrawalAmount
 
      const { error: walletUpdateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance, total_withdrawn: newTotalWithdrawn })
        .eq('user_id', user.id)

      if (walletUpdateError) {
        throw new Error('Failed to deduct wallet balance')
      }

      const { data: withdrawals, error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: withdrawalAmount,
          payment_method: paymentMethod,
          account_details: accountDetails,
          status: 'pending',
        })
        .select()
        .single()
      console.log("Withdrawal error:", withdrawalError)

      if (withdrawalError) {
        // Rollback wallet balance if withdrawal insert fails
        await supabase.from('wallets').update({ balance: wallet.balance }).eq('user_id', user.id)
        throw withdrawalError
      }

      // Create transaction record
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          reference_id: withdrawals.id,
          type: 'withdrawal',
          amount: -withdrawalAmount,
          status: 'pending',
          description: `Withdrawal request via ${paymentMethod === 'cbe' ? 'CBE Bank' : 'Telebirr'} - Balance deducted`,
        })

      if (error) {
        await supabase.from('wallets').update({ balance: wallet.balance }).eq('user_id', user.id)
        throw error
      }


      // Update local state
      setWalletBalance(newBalance)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit withdrawal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const STEP_LABELS = ['Amount', 'Method', 'Account', 'Confirm']
  const panel = 'rounded-3xl border border-border bg-card p-6 sm:p-8'
  const methodButton = 'group flex w-full items-center gap-4 rounded-2xl border border-border bg-background p-4 text-left transition-[border-color,background-color,transform] hover:border-brand/50 hover:bg-accent active:scale-[0.995]'

  if (isLoading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading withdrawal options</span>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-8 h-80 rounded-3xl" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 text-center animate-fade-up" role="status">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h1 className="text-h2 mt-6">Withdrawal requested</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your request has been received. It will be reviewed and processed within 12–24 hours.
        </p>
        <Button asChild size="lg" className="mt-7 w-full">
          <Link href="/dashboard">Back to overview</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link href="/dashboard"><ArrowLeft /> Overview</Link>
      </Button>

      <PageHeader eyebrow={`Step ${step} of 4`} title="Withdraw funds" />

      <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Withdrawal progress">
        {STEP_LABELS.map((label, idx) => {
          const n = idx + 1
          return (
            <li key={label} aria-current={n === step ? 'step' : undefined}>
              <div className={cn('h-1 rounded-full transition-colors duration-500', n <= step ? 'bg-gradient-to-r from-brand to-brand-2' : 'bg-muted')} />
              <p className={cn('mt-2 text-[11px] font-medium', n === step ? 'text-foreground' : 'text-muted-foreground')}>{label}</p>
            </li>
          )
        })}
      </ol>

      <div className="mb-5 flex items-center justify-between rounded-2xl border border-border bg-muted/50 px-5 py-4">
        <span className="text-sm text-muted-foreground">Withdrawable balance</span>
        <span className="num font-display text-lg font-semibold">ETB {availableWithdrawal.toLocaleString()}</span>
      </div>

      {/* Step 1: Enter Amount */}
      {step === 1 && (
        <section className={panel} aria-labelledby="wd-h">
          <h2 id="wd-h" className="text-h3">How much would you like to withdraw?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Minimum withdrawal is ETB {MIN_WITHDRAWAL.toLocaleString()}.
          </p>
          <form onSubmit={handleAmountSubmit} className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (ETB)</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={MIN_WITHDRAWAL}
                max={availableWithdrawal}
                required
                className="num h-12 text-lg"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" size="lg" className="w-full">Continue</Button>
          </form>
        </section>
      )}

      {/* Step 2: Choose Payment Method */}
      {step === 2 && (
        <section className={cn(panel, 'space-y-3')} aria-labelledby="wd-h">
          <h2 id="wd-h" className="text-h3">Where should we send it?</h2>
          <p className="pb-2 text-sm text-muted-foreground">
            Withdrawing ETB {parseFloat(amount).toLocaleString()}
          </p>

          <button type="button" onClick={() => handlePaymentMethodSelect('cbe')} className={methodButton}>
            <span className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand-ink">
              <Building2 className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-semibold">CBE Bank</span>
              <span className="block text-sm text-muted-foreground">Commercial Bank of Ethiopia</span>
            </span>
          </button>

          <button type="button" onClick={() => handlePaymentMethodSelect('telebirr')} className={methodButton}>
            <span className="grid size-11 place-items-center rounded-xl bg-info/10 text-info">
              <Smartphone className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-semibold">Telebirr</span>
              <span className="block text-sm text-muted-foreground">Mobile money</span>
            </span>
          </button>

          <Button variant="outline" size="lg" className="mt-3 w-full" onClick={() => setStep(1)}>
            Back
          </Button>
        </section>
      )}

      {/* Step 3: Account Details */}
      {step === 3 && (
        <section className={panel} aria-labelledby="wd-h">
          <h2 id="wd-h" className="text-h3">Your account details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {paymentMethod === 'cbe'
              ? 'Enter your CBE bank account number.'
              : 'Enter your Telebirr phone number.'}
          </p>
          <form onSubmit={handleAccountDetailsSubmit} className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="accountDetails">
                {paymentMethod === 'cbe' ? 'Account number' : 'Phone number'}
              </Label>
              <Input
                id="accountDetails"
                type="text"
                inputMode={paymentMethod === 'cbe' ? 'numeric' : 'tel'}
                placeholder={paymentMethod === 'cbe' ? 'Enter account number' : 'e.g., +251912345678'}
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                required
                className="num"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(2)} type="button">
                Back
              </Button>
              <Button type="submit" size="lg" className="flex-1">Continue</Button>
            </div>
          </form>
        </section>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <section className={cn(panel, 'space-y-5')} aria-labelledby="wd-h">
          <div>
            <h2 id="wd-h" className="text-h3">Review your withdrawal</h2>
            <p className="mt-1 text-sm text-muted-foreground">Check the details before you submit.</p>
          </div>

          <dl className="divide-y divide-border rounded-2xl border border-border bg-muted/50 px-4 text-sm">
            <div className="flex justify-between py-3.5">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="num font-semibold">ETB {parseFloat(amount).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between py-3.5">
              <dt className="text-muted-foreground">Method</dt>
              <dd className="font-semibold">{paymentMethod === 'cbe' ? 'CBE Bank' : 'Telebirr'}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3.5">
              <dt className="text-muted-foreground">{paymentMethod === 'cbe' ? 'Account' : 'Phone'}</dt>
              <dd className="num break-all font-mono font-semibold">{accountDetails}</dd>
            </div>
          </dl>

          <Alert variant="warning">
            <AlertCircle />
            <AlertDescription>
              Withdrawals are processed within 12–24 hours. Please make sure your account details are correct.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(3)} disabled={isSubmitting}>
              Back
            </Button>
            <Button size="lg" className="flex-1" onClick={handleSubmitWithdrawal} loading={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Confirm withdrawal'}
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
