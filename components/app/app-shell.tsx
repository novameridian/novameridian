'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  LayoutGrid,
  Layers,
  LogOut,
  Receipt,
  UserRound,
} from 'lucide-react'

import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ShellProfile = {
  id: string
  email: string
  full_name: string | null
  role: string
}

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutGrid },
  { href: '/orders', label: 'Investments', icon: Layers },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/profile', label: 'Profile', icon: UserRound },
]

const ACTIONS = [
  { href: '/deposit', label: 'Deposit', icon: ArrowDownToLine },
  { href: '/withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
]

function initials(p: ShellProfile | null) {
  const src = (p?.full_name || p?.email || '?').trim()
  const parts = src.split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

export function AppShell({
  profile,
  pathname,
  onLogout,
  children,
}: {
  profile: ShellProfile | null
  pathname: string
  onLogout: () => void
  children: ReactNode
}) {
  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[17rem_1fr]">
      <a
        href="#app-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* ── Desktop sidebar ── */}
      <aside className="sticky top-0 hidden h-svh flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
        <Link href="/dashboard" className="mb-8 px-2" aria-label="Nova Meridian dashboard">
          <Logo />
        </Link>

        <nav aria-label="Main" className="flex-1">
          <p className="eyebrow mb-3 px-2 !text-muted-foreground">Account</p>
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                    )}
                  >
                    {active && (
                      <span className="absolute -left-4 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand" aria-hidden="true" />
                    )}
                    <item.icon className={cn('size-[18px]', active && 'text-brand-ink')} aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <p className="eyebrow mb-3 mt-8 px-2 !text-muted-foreground">Move money</p>
          <ul className="space-y-1">
            {ACTIONS.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                    )}
                  >
                    <item.icon className="size-[18px]" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="mt-6 rounded-2xl border border-sidebar-border bg-background/60 p-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-xs font-bold text-brand-foreground">
              {initials(profile)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{profile?.full_name || 'Member'}</p>
              <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onLogout}>
              <LogOut /> Sign out
            </Button>
            <ThemeToggle className="size-8" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* ── Mobile / tablet top bar ── */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-xl lg:hidden">
          <Link href="/dashboard" aria-label="Nova Meridian dashboard">
            <Logo markClassName="size-7" />
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Sign out">
              <LogOut aria-hidden="true" />
            </Button>
          </div>
        </header>

        <main id="app-main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </main>

        {/* ── Mobile bottom navigation ── */}
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        >
          <ul className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-2">
            {[NAV[0], NAV[1], null, NAV[2], NAV[3]].map((item, i) =>
              item ? (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors',
                      isActive(pathname, item.href) ? 'text-brand-ink' : 'text-muted-foreground',
                    )}
                  >
                    <item.icon className="size-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              ) : (
                <li key={`gap-${i}`} className="flex justify-center">
                  <Link
                    href="/deposit"
                    aria-label="Deposit"
                    className="-mt-6 grid size-14 place-items-center rounded-full bg-brand text-brand-foreground shadow-[0_10px_24px_-8px_rgb(25_211_197/0.8)] ring-4 ring-background transition-transform active:scale-95"
                  >
                    <ArrowDownToLine className="size-6" aria-hidden="true" />
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
      </div>
    </div>
  )
}
