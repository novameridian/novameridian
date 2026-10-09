"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ArrowRight, Menu, X } from "lucide-react"

import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { MARKETING_NAV } from "@/lib/site"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-6 px-5 lg:px-8">
        <Link href="/" aria-label="Nova Meridian home" className="rounded-md">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden justify-center lg:flex">
          <ul className="flex items-center gap-1 rounded-full border border-border bg-card/60 p-1 backdrop-blur">
            {MARKETING_NAV.map((item) => {
              const active = item.href === pathname
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground",
                      active && "bg-accent text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center justify-end gap-1.5">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/auth/sign-up">
              Open an account <ArrowRight />
            </Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="top"
              showCloseButton={false}
              className="h-[100dvh] max-h-none gap-0 border-0 bg-background p-0"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">Site navigation and account links</SheetDescription>
              <div className="relative flex h-full flex-col overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-horizon-glow opacity-80" />
                <div className="relative flex h-16 items-center justify-between px-5">
                  <Logo />
                  <SheetClose asChild>
                    <Button variant="outline" size="icon" aria-label="Close menu">
                      <X aria-hidden="true" />
                    </Button>
                  </SheetClose>
                </div>
                <nav aria-label="Mobile" className="relative flex-1 overflow-y-auto px-5 pt-6">
                  <ul>
                    {MARKETING_NAV.map((item, i) => (
                      <li key={item.href} className="border-b border-border">
                        <SheetClose asChild>
                          <Link
                            href={item.href}
                            className="flex items-baseline gap-4 py-5 font-display text-3xl font-semibold tracking-tight text-foreground"
                          >
                            <span className="num text-xs font-medium text-brand-ink">0{i + 1}</span>
                            {item.label}
                          </Link>
                        </SheetClose>
                      </li>
                    ))}
                    <li className="border-b border-border">
                      <SheetClose asChild>
                        <Link href="/faq" className="flex items-baseline gap-4 py-5 font-display text-3xl font-semibold tracking-tight text-foreground">
                          <span className="num text-xs font-medium text-brand-ink">06</span>
                          FAQ
                        </Link>
                      </SheetClose>
                    </li>
                  </ul>
                </nav>
                <div className="relative grid gap-3 border-t border-border bg-background/80 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur">
                  <SheetClose asChild>
                    <Button asChild size="lg" variant="brand">
                      <Link href="/auth/sign-up">Open an account <ArrowRight /></Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild size="lg" variant="outline">
                      <Link href="/auth/login">Sign in</Link>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
