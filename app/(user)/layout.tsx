'use client'

import React from "react"

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app/app-shell'
import { FullPageSpinner } from '@/components/app/auth-shell'

type UserProfile = {
  id: string
  email: string
  full_name: string | null
  role: string
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
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
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (isLoading) {
    return <FullPageSpinner label="Loading your account" />
  }

  return (
    <AppShell profile={profile} pathname={pathname} onLogout={handleLogout}>
      {children}
    </AppShell>
  )
}
