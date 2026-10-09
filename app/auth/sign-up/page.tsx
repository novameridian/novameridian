'use client'

import React from "react"

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import HCaptcha from "@hcaptcha/react-hcaptcha"
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { AuthShell, FullPageSpinner } from '@/components/app/auth-shell'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [captchaToken, setCaptchaToken] = useState("")
  const captchaRef = useRef<HCaptcha>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        router.push('/dashboard')
      } else {
        setIsCheckingAuth(false)
      }
    }
    
    checkAuth()
  }, [router])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    if (!captchaToken) {
      setError("Please complete the captcha")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referralCode,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message)
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          captchaToken,
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            referred_by: result.referrerId,
          },
        },
      })
      captchaRef.current?.resetCaptcha()
      setCaptchaToken("")
      if (error) throw error
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return <FullPageSpinner label="Checking your session" />
  }

  // Same message mapping as before, expressed against the string state.
  const errorText = error
    ? error.includes("email rate limit exceeded")
      ? "Sorry, the server is busy at the moment. Please try again later."
      : error
    : null

  return (
    <AuthShell
      title="Open your account"
      description="Registration is by invitation. Enter the referral code you were given to continue."
      footer={
        <>
          {'Already a member? '}
          <Link
            href="/auth/login"
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSignUp}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="repeat-password">Confirm password</Label>
              <Input
                id="repeat-password"
                type="password"
                autoComplete="new-password"
                required
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="referral-code">Referral code</Label>
            <Input
              id="referral-code"
              type="text"
              autoComplete="off"
              placeholder="Code from an existing member"
              required
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <HCaptcha
            ref={captchaRef}
            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
            onVerify={(token) => {
              setCaptchaToken(token)
            }}
          />
          {errorText && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{errorText}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" size="lg" className="w-full" loading={isLoading}>
            {isLoading ? 'Creating account…' : 'Create account'}
          </Button>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            By continuing you agree to our{' '}
            <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">Terms</Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>.
          </p>
        </div>
      </form>
    </AuthShell>
  )
}
