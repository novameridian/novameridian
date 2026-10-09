'use client'

import React from "react"

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/app/page-header'
import { TELEGRAM_URL } from '@/lib/site'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Check,
  Building2,
  Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'

type PaymentMethod = 'cbe' | 'telebirr' | 'awash' | null

type PaymentAccount = {
  name: string
  number: string
  enabled: boolean
}

type PaymentDetails = {
  cbe: PaymentAccount
  telebirr: PaymentAccount
  awash: PaymentAccount
}

export default function DepositPage() {
  // v2.1 - Fixed deposit submission with method field
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const router = useRouter()
  const [minDeposit, setMinDeposit] = useState(0)

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      setIsLoading(true)
      const supabase = createClient()

      const { data: minDepositData } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "min_deposit")
        .single()

      setMinDeposit(Number(minDepositData?.value ?? 2500))
      
      // First try payment_methods table
      const { data: paymentMethods } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('active', true)

      if (paymentMethods && paymentMethods.length > 0) {
        const details: PaymentDetails = {
          cbe: { name: '', number: '', enabled: false },
          telebirr: { name: '', number: '', enabled: false },
          awash: { name: '', number: '', enabled: false }
        }

        paymentMethods.forEach((pm: { name: string; account_name: string; account_number: string; active: boolean }) => {
          const key = pm.name.toLowerCase().replace(' bank', '').replace(' ', '') as keyof PaymentDetails
          if (key === 'cbe' || key === 'telebirr' || key === 'awash') {
            details[key] = {
              name: pm.account_name,
              number: pm.account_number,
              enabled: pm.active
            }
          }
        })

        setPaymentDetails(details)
        setIsLoading(false)
        return
      }

      // Fallback to platform_settings
      const { data: settings } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'cbe_account_name', 'cbe_account_number', 'cbe_enabled',
          'telebirr_account_name', 'telebirr_account_number', 'telebirr_enabled',
          'awash_account_name', 'awash_account_number', 'awash_enabled'
        ])

      if (settings) {
        const settingsMap: Record<string, string> = {}
        settings.forEach((s: { setting_key: string; setting_value: string }) => {
          settingsMap[s.setting_key] = s.setting_value
        })

        setPaymentDetails({
          cbe: {
            name: settingsMap.cbe_account_name || '',
            number: settingsMap.cbe_account_number || '',
            enabled: settingsMap.cbe_enabled !== 'false'
          },
          telebirr: {
            name: settingsMap.telebirr_account_name || '',
            number: settingsMap.telebirr_account_number || '',
            enabled: settingsMap.telebirr_enabled !== 'false'
          },
          awash: {
            name: settingsMap.awash_account_name || '',
            number: settingsMap.awash_account_number || '',
            enabled: settingsMap.awash_enabled !== 'false'
          }
        })
      }
      setIsLoading(false)
    }

    fetchPaymentDetails()
  }, [])

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < minDeposit) {
      setError(`Minimum deposit amount is ETB ${minDeposit.toLocaleString()}`)
      return
    }
    
    setStep(2)
  }

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method)
    setStep(3)
  }

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSubmitDeposit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error("[NovaMeridian] Auth error:", authError)
        throw authError
      }

      if (!user) {
        router.push('/auth/login')
        return
      }

      const depositData = {
        user_id: user.id,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        method: paymentMethod,  // Database requires both payment_method AND method - CRITICAL
        status: 'pending',
        created_at: new Date().toISOString(),
      }

      const { data: depositResult, error: depositError } = await supabase
        .from('deposits')
        .insert([depositData])
        .select()
        .single()

      if (depositError) {
        console.error("[NovaMeridian] Deposit insert error:", depositError)
        throw depositError
      }

      // Create transaction record
      const transactionData = {
        user_id: user.id,
        type: 'deposit',
        amount: parseFloat(amount),
        status: 'pending',
        description: `Deposit request via ${paymentMethod === 'cbe' ? 'CBE Bank' : paymentMethod === 'telebirr' ? 'Telebirr' : 'Awash Bank'}`,
        reference_id: depositResult.id,
        created_at: new Date().toISOString(),
      }

      const { data: txResult, error: txError } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()

      if (txError) {
        console.error("[NovaMeridian] Transaction insert error:", txError)
        console.warn("[NovaMeridian] Continuing despite transaction error")
      } else {
        console.log("[NovaMeridian] Transaction created:", txResult)
      }

      setSuccess(true)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit deposit'
      console.error("[NovaMeridian] Deposit submission error:", errorMsg)
      setError(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const STEP_LABELS = ['Amount', 'Method', 'Send', 'Confirm']
  const methodLabel =
    paymentMethod === 'cbe' ? 'CBE Bank' : paymentMethod === 'telebirr' ? 'Telebirr' : 'Awash Bank'

  const panel = 'rounded-3xl border border-border bg-card p-6 sm:p-8'

  if (isLoading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading deposit options</span>
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
        <h1 className="text-h2 mt-6">Deposit submitted</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your request has been received and will be processed within 12–24 hours. To help us confirm it
          faster, send a screenshot of your payment confirmation to our{' '}
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground underline underline-offset-4"
          >
            support bot on Telegram
          </a>
          .
        </p>
        <Button asChild size="lg" className="mt-7 w-full">
          <Link href="/dashboard">Back to overview</Link>
        </Button>
      </div>
    )
  }

  const methodButton = 'group flex w-full items-center gap-4 rounded-2xl border border-border bg-background p-4 text-left transition-[border-color,background-color,transform] hover:border-brand/50 hover:bg-accent active:scale-[0.995]'

  return (
    <div className="mx-auto max-w-xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link href="/dashboard"><ArrowLeft /> Overview</Link>
      </Button>

      <PageHeader eyebrow={`Step ${step} of 4`} title="Deposit funds" />

      {/* Stepper */}
      <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Deposit progress">
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

      {/* Step 1: Enter Amount */}
      {step === 1 && (
        <section className={panel} aria-labelledby="dep-h">
          <h2 id="dep-h" className="text-h3">How much would you like to deposit?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Minimum deposit is ETB {minDeposit.toLocaleString()}.
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
                min={minDeposit}
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
        <section className={cn(panel, 'space-y-3')} aria-labelledby="dep-h">
          <h2 id="dep-h" className="text-h3">Choose a payment method</h2>
          <p className="pb-2 text-sm text-muted-foreground">
            Depositing ETB {parseFloat(amount).toLocaleString()}
          </p>

          {paymentDetails?.cbe.enabled && paymentDetails.cbe.number && (
            <button type="button" onClick={() => handlePaymentMethodSelect('cbe')} className={methodButton}>
              <span className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand-ink">
                <Building2 className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold">CBE Bank</span>
                <span className="block text-sm text-muted-foreground">Commercial Bank of Ethiopia</span>
              </span>
            </button>
          )}

          {paymentDetails?.telebirr.enabled && paymentDetails.telebirr.number && (
            <button type="button" onClick={() => handlePaymentMethodSelect('telebirr')} className={methodButton}>
              <span className="grid size-11 place-items-center rounded-xl bg-info/10 text-info">
                <Smartphone className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold">Telebirr</span>
                <span className="block text-sm text-muted-foreground">Mobile money</span>
              </span>
            </button>
          )}

          {paymentDetails?.awash.enabled && paymentDetails.awash.number && (
            <button type="button" onClick={() => handlePaymentMethodSelect('awash')} className={methodButton}>
              <span className="grid size-11 place-items-center rounded-xl bg-chart-2/15 text-chart-2">
                <Building2 className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold">Awash Bank</span>
                <span className="block text-sm text-muted-foreground">Awash International Bank</span>
              </span>
            </button>
          )}

          <Button variant="outline" size="lg" className="mt-3 w-full" onClick={() => setStep(1)}>
            Back
          </Button>
        </section>
      )}

      {/* Step 3: Payment Details */}
      {step === 3 && paymentDetails && (
        <section className={cn(panel, 'space-y-5')} aria-labelledby="dep-h">
          <div>
            <h2 id="dep-h" className="text-h3">Send your payment</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Transfer exactly ETB {parseFloat(amount).toLocaleString()} to the account below.
            </p>
          </div>

          {paymentMethod && paymentDetails && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Account name</Label>
                <div className="flex items-center justify-between rounded-2xl bg-muted p-3.5 pl-4">
                  <span className="font-medium">{paymentDetails[paymentMethod].name}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Copy account name"
                    onClick={() => handleCopy(paymentDetails[paymentMethod].name, 'name')}
                  >
                    {copied === 'name' ? <Check className="text-success" /> : <Copy />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  {paymentMethod === 'telebirr' ? 'Phone number' : 'Account number'}
                </Label>
                <div className="flex items-center justify-between rounded-2xl bg-muted p-3.5 pl-4">
                  <span className="num font-mono font-medium tracking-wide">{paymentDetails[paymentMethod].number}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={paymentMethod === 'telebirr' ? 'Copy phone number' : 'Copy account number'}
                    onClick={() => handleCopy(paymentDetails[paymentMethod].number, 'number')}
                  >
                    {copied === 'number' ? <Check className="text-success" /> : <Copy />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Alert variant="warning">
            <AlertCircle />
            <AlertDescription>
              Deposits are processed within 12–24 hours. If you send more than the requested amount, the excess will not be refunded.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button size="lg" className="flex-1" onClick={() => setStep(4)}>
              I have sent the money
            </Button>
          </div>
        </section>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <section className={cn(panel, 'space-y-5')} aria-labelledby="dep-h">
          <div>
            <h2 id="dep-h" className="text-h3">Confirm your deposit</h2>
            <p className="mt-1 text-sm text-muted-foreground">Please confirm that the payment has been sent.</p>
          </div>

          <dl className="divide-y divide-border rounded-2xl border border-border bg-muted/50 px-4 text-sm">
            <div className="flex justify-between py-3.5">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="num font-semibold">ETB {parseFloat(amount).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between py-3.5">
              <dt className="text-muted-foreground">Payment method</dt>
              <dd className="font-semibold">{methodLabel}</dd>
            </div>
          </dl>

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
            <Button size="lg" className="flex-1" onClick={handleSubmitDeposit} loading={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Confirm deposit'}
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
