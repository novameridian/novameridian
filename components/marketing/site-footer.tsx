import Link from "next/link"
import { Logo } from "@/components/brand/logo"
import { SITE_NAME, SUPPORT_EMAIL, TELEGRAM_URL } from "@/lib/site"

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "/#plans", label: "Investment plans" },
      { href: "/#how", label: "How it works" },
      { href: "/security", label: "Security" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: TELEGRAM_URL, label: "Telegram support", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
] as const

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <Link href="/" aria-label={`${SITE_NAME} home`}>
              <Logo />
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              A New Direction for Your Financial Future. Clearly defined plans, a transparent ledger and
              straightforward account tools.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-5 inline-block text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h2 className="eyebrow !text-muted-foreground">{col.title}</h2>
                <ul className="mt-5 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {"external" in l && l.external ? (
                        <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-sm text-body transition-colors hover:text-foreground">
                          {l.label}
                        </a>
                      ) : (
                        <Link href={l.href} className="text-sm text-body transition-colors hover:text-foreground">
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Investing involves risk, including the possible loss of capital. Plan terms such as reward rate and
            duration are set per plan and may change; review the terms of each plan before you commit funds.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
