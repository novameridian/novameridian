'use client'

import React, { useRef } from "react"
import HCaptcha from "@hcaptcha/react-hcaptcha"

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { AlertCircle } from 'lucide-react'
import { AuthShell, FullPageSpinner } from '@/components/app/auth-shell'
import { Alert, AlertDescription } from '@/components/ui/alert'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [captchaToken, setCaptchaToken] = useState("")
  const captchaRef = useRef<HCaptcha>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Get user role and redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        const role = profile?.role || 'user'
        const dashboardPaths: Record<string, string> = {
          user: '/dashboard',
          moderator: '/moderator',
          admin: '/admin',
          super_admin: '/super-admin',
        }
        router.push(dashboardPaths[role] || '/dashboard')
      } else {
        setIsCheckingAuth(false)
      }
    }
    
    checkAuth()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (!captchaToken) {
      setError("Please complete the captcha")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken,
        },
      })

      captchaRef.current?.resetCaptcha()
      setCaptchaToken("")
      
      if (error) throw error
      
      if (data.user) {
        // Get user role and redirect to appropriate dashboard
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_banned')
          .eq('id', data.user.id)
          .single()
        
        if (profile?.is_banned) {
          await supabase.auth.signOut()
          throw new Error('Your account has been banned. Contact support for assistance.')
        }
        
        const role = profile?.role || 'user'
        const dashboardPaths: Record<string, string> = {
          user: '/dashboard',
          moderator: '/moderator',
          admin: '/admin',
          super_admin: '/super-admin',
        }
        
        router.push(dashboardPaths[role] || '/dashboard')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const errorParam = searchParams.get('error')
  const bannedError = errorParam === 'banned'

  if (isCheckingAuth) {
    return <FullPageSpinner label="Checking your session" />
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to view your wallet, plans and recent activity."
      footer={
        <>
          {"New to Nova Meridian? "}
          <Link
            href="/auth/sign-up"
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            Open an account
          </Link>
        </>
      }
    >
      {bannedError && (
        <Alert variant="destructive" className="mb-5">
          <AlertCircle />
          <AlertDescription>
            Your account has been banned. Contact support for assistance.
          </AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleLogin} noValidate={false}>
        <div className="flex flex-col gap-5">
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
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <HCaptcha
            ref={captchaRef}
            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
            onVerify={(token) => setCaptchaToken(token)}
          />
          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" size="lg" className="w-full" loading={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <LoginForm />
    </Suspense>
  )
}
