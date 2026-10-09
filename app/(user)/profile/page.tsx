'use client'

import React from "react"

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader, EmptyState } from '@/components/app/page-header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, CheckCircle2, User, Mail, Key, Copy, Check, Users } from 'lucide-react'
import { toast } from "sonner"
import { cn } from '@/lib/utils'

type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
  referral_code: string | null
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  // Form states
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [refData, setRefData] = useState({
    totalInvited: 0,
    totalConverted: 0,
    totalPending: 0,
    totalEarned: 0,
    invitedUsers: [],
    rewards: [],
  })
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())
  
  // Password form states
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const router = useRouter()

  const getTimeLeft = (availableAt: string) => {
    const diff = new Date(availableAt).getTime() - now

    if (diff <= 0) return null

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)

    return `${days}d ${hours}h`
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFullName(profileData.full_name || '')
        setEmail(profileData.email)
      }

      setIsLoading(false)
    }

    fetchProfile()
  }, [router])

  const handleCopyReferralCode = async () => {
    if (profile) {
      await navigator.clipboard.writeText(profile.referral_code || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
}

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          email: email,
        })
        .eq('id', profile?.id)

      if (profileError) throw profileError

      // Update auth email if changed
      if (email !== profile?.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: email,
        })
        if (authError) throw authError
      }

      setSuccess('Profile updated successfully')
      setProfile(prev => prev ? { ...prev, full_name: fullName, email } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setIsChangingPassword(false)
      return
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      setIsChangingPassword(false)
      return
    }

    try {
      const supabase = createClient()
      
      // First verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: currentPassword,
      })

      if (signInError) {
        throw new Error('Current password is incorrect')
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      setSuccess('Password changed successfully')
      setShowPasswordForm(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  useEffect(() => {
  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/referrals/dashboard")

      if (!res.ok) {
        throw new Error(`Failed to fetch dashboard: ${res.status}`)
      }

      const data = await res.json()

      setRefData(data)
    } catch (err) {
      console.error("[NovaMeridian] Dashboard fetch error:", err)

      // optional fallback so UI doesn't die
      setRefData({
        totalInvited: 0,
        totalConverted: 0,
        totalPending: 0,
        totalEarned: 0,
        invitedUsers: [],
        rewards: [],
      })
    }
  }

  fetchDashboard()
}, [])

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (isLoading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading your profile</span>
        <Skeleton className="h-9 w-40" />
        <div className="mt-8 grid gap-5 lg:grid-cols-[20rem_1fr]">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-[28rem] rounded-3xl" />
        </div>
      </div>
    )
  }

  const panel = 'rounded-3xl border border-border bg-card p-6 sm:p-7'
  const money = (n: unknown) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div>
      <PageHeader eyebrow="Account" title="Profile" description="Your details, referral activity and security settings." />

      <div className="mb-5 space-y-3" aria-live="polite">
        {success && (
          <Alert variant="success" role="status">
            <CheckCircle2 />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[20rem_1fr]">
        {/* ── Identity ── */}
        <aside className={cn(panel, 'text-center lg:sticky lg:top-8')}>
          <Avatar className="mx-auto size-20 ring-2 ring-brand/30 ring-offset-4 ring-offset-card">
            <AvatarImage src={profile?.avatar_url || undefined} alt="" />
            <AvatarFallback className="bg-gradient-to-br from-brand to-brand-2 text-xl font-bold text-brand-foreground">
              {getInitials(profile?.full_name ?? null)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-h3 mt-5">{profile?.full_name || 'Member'}</h2>
          <p className="mt-1 break-all text-sm text-muted-foreground">{profile?.email}</p>

          <div className="mt-6 rounded-2xl border border-border bg-muted/60 p-4 text-left">
            <p className="text-xs font-medium text-muted-foreground">Your referral code</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="num font-mono text-base font-semibold tracking-wide">{profile?.referral_code}</span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleCopyReferralCode}
                aria-label={copied ? 'Referral code copied' : 'Copy referral code'}
              >
                {copied ? <Check className="text-success" /> : <Copy />}
              </Button>
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          {/* ── Referrals ── */}
          <section className={panel} aria-labelledby="ref-h">
            <h2 id="ref-h" className="text-h3">Referrals</h2>
            <p className="mt-1 text-sm text-muted-foreground">Track the people you have invited and the rewards they unlock.</p>

            <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-2xl bg-muted/70 p-4">
                <dt className="text-xs text-muted-foreground">Total earned</dt>
                <dd className="num mt-2 font-display text-lg font-semibold text-success">
                  <span className="mr-1 text-[11px] font-medium text-muted-foreground">ETB</span>{money(refData.totalEarned)}
                </dd>
              </div>
              <div className="rounded-2xl bg-muted/70 p-4">
                <dt className="text-xs text-muted-foreground">Invited</dt>
                <dd className="num mt-2 font-display text-lg font-semibold">{refData.totalInvited}</dd>
              </div>
              <div className="rounded-2xl bg-muted/70 p-4">
                <dt className="text-xs text-muted-foreground">Deposited</dt>
                <dd className="num mt-2 font-display text-lg font-semibold text-success">{refData.totalConverted}</dd>
              </div>
              <div className="rounded-2xl bg-muted/70 p-4">
                <dt className="text-xs text-muted-foreground">Not yet deposited</dt>
                <dd className="num mt-2 font-display text-lg font-semibold text-warning">{refData.totalPending}</dd>
              </div>
            </dl>

            <h3 className="mt-8 text-sm font-semibold">Referral rewards</h3>
            {(refData.rewards ?? []).length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  icon={<Users className="size-5" aria-hidden="true" />}
                  title="No referral rewards yet"
                  description="Share your referral code. Rewards appear here once someone you invited makes a deposit."
                />
              </div>
            ) : (
              <ul className="mt-3 max-h-80 divide-y divide-border overflow-auto rounded-2xl border border-border">
                {(refData.rewards ?? []).map((r: any) => {
                  const rewardId = r.id ?? r.reward_id
                  if (!rewardId) return null

                  const status = (r.status || "").toLowerCase().trim()

                  const availableAt = r.available_at
                    ? new Date(r.available_at).getTime()
                    : null

                  const isAvailable = availableAt ? availableAt <= now : true
                  const timeLeft = availableAt ? getTimeLeft(r.available_at) : null

                  return (
                    <li key={rewardId} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="num font-mono text-xs text-muted-foreground">
                          User {r.referred_user_id?.slice(0, 8) ?? "unknown"}…
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : "N/A"}
                        </p>
                        {status === "pending" && (
                          <Badge variant="warning" className="mt-2">
                            {isAvailable ? "Ready to claim" : `Unlocks in ${timeLeft}`}
                          </Badge>
                        )}
                        {status === "claimed" && (
                          <Badge variant="success" className="mt-2">
                            <Check /> Added to wallet
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <p className="num font-semibold text-success">+ ETB {money(r.reward_amount)}</p>
                        {status === "pending" && isAvailable && (
                          <Button
                            size="sm"
                            variant="brand"
                            loading={claimingId === rewardId}
                            onClick={async () => {
                              setClaimingId(rewardId)

                              try {
                                const res = await fetch("/api/referrals/claim", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ rewardId }),
                                })

                                if (!res.ok) throw new Error("Failed to claim")

                                const updated = await fetch("/api/referrals/dashboard")
                                const data = await updated.json()
                                setRefData(data)
                                toast.success("Referral claimed successfully!")
                              } catch (err) {
                                console.error(err)
                                toast.error("We could not claim that reward. Please try again.")
                              } finally {
                                setClaimingId(null)
                              }
                            }}
                          >
                            Add to wallet
                          </Button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* ── Personal information ── */}
          <section className={panel} aria-labelledby="pi-h">
            <h2 id="pi-h" className="text-h3 flex items-center gap-2.5">
              <User className="size-[18px] text-brand-ink" aria-hidden="true" />
              Personal information
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Update the details we hold for you.</p>
            <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full sm:w-auto" loading={isSaving}>
                {isSaving ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </section>

          {/* ── Password ── */}
          <section className={panel} aria-labelledby="pw-h">
            <h2 id="pw-h" className="text-h3 flex items-center gap-2.5">
              <Key className="size-[18px] text-brand-ink" aria-hidden="true" />
              Password
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose a strong password you do not use elsewhere.</p>
            {!showPasswordForm ? (
              <Button variant="outline" size="lg" className="mt-6 w-full sm:w-auto" onClick={() => setShowPasswordForm(true)}>
                Change password
              </Button>
            ) : (
              <form onSubmit={handleChangePassword} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <Separator />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setShowPasswordForm(false)
                      setCurrentPassword('')
                      setNewPassword('')
                      setConfirmPassword('')
                      setError(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="lg" loading={isChangingPassword}>
                    {isChangingPassword ? 'Updating…' : 'Update password'}
                  </Button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
