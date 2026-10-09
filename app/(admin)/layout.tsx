'use client'

import React from "react"

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Settings,
  UserCog,
  FileText,
  Flag
} from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { FullPageSpinner } from '@/components/app/auth-shell'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type UserProfile = {
  id: string
  email: string
  full_name: string | null
  role: string
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
        // Check if user has staff role
        if (!['moderator', 'admin', 'super_admin'].includes(profileData.role)) {
          router.push('/dashboard')
          return
        }
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
    return <FullPageSpinner label="Loading console" />
  }

  // Determine which navigation items to show based on role
  const isSuperAdmin = profile?.role === 'super_admin'
  const isModerator = profile?.role === 'moderator'

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/deposits', label: 'Deposits', icon: ArrowDownToLine },
    { href: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
    { href: '/admin/investments', label: 'Investments', icon: TrendingUp },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ]

  const superAdminNavItems = [
    { href: '/super-admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/super-admin/plans', label: 'Investment Plans', icon: TrendingUp },
    { href: '/super-admin/users', label: 'All Users', icon: Users },
    { href: '/super-admin/admins', label: 'Staff Management', icon: UserCog },
    { href: '/super-admin/settings', label: 'System Settings', icon: Settings },
    { href: '/super-admin/audit-logs', label: 'Audit Logs', icon: FileText },
  ]

  const moderatorNavItems = [
    { href: '/moderator', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/moderator/reports', label: 'Reports & Flags', icon: Flag },
  ]

  // Select the right nav items based on current path and role
  let navItems = adminNavItems
  let panelTitle = 'Admin Panel'
  
  if (pathname.startsWith('/super-admin')) {
    navItems = superAdminNavItems
    panelTitle = 'Super Admin'
  } else if (pathname.startsWith('/moderator')) {
    navItems = moderatorNavItems
    panelTitle = 'Moderator Panel'
  } else if (pathname.startsWith('/admin')) {
    // Super admins can also access admin panel
    navItems = adminNavItems
    panelTitle = isSuperAdmin ? 'Admin Panel (Super Admin)' : 'Admin Panel'
  }

  const isActive = (href: string) =>
    pathname === href ||
    (!['/admin', '/super-admin', '/moderator'].includes(href) && pathname.startsWith(href + '/'))

  return (
    <div className="flex min-h-svh bg-background">
      <a
        href="#console-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Console navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-svh lg:w-64 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/admin" aria-label="Nova Meridian console">
            <Logo />
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <div className="px-5 pb-3 pt-2">
          <span className="eyebrow !text-muted-foreground">{panelTitle}</span>
        </div>

        <nav aria-label="Console" className="flex-1 overflow-y-auto px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                    )}
                  >
                    {active && (
                      <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand" aria-hidden="true" />
                    )}
                    <Icon className={cn("size-[18px]", active && "text-brand-ink")} aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-3">
          <div className="rounded-2xl border border-sidebar-border bg-background/60 p-3">
            <p className="truncate text-[13px] font-semibold">{profile?.full_name || profile?.email}</p>
            <p className="mt-0.5 text-xs capitalize text-muted-foreground">{profile?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-xl lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu aria-hidden="true" />
          </Button>
          <p className="hidden font-display text-[15px] font-semibold tracking-tight lg:block">{panelTitle}</p>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sign out">
              <LogOut aria-hidden="true" />
            </Button>
          </div>
        </header>

        <main id="console-main" className="mx-auto w-full max-w-[90rem] flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
