import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  AlertTriangle,
  CreditCard,
  Database,
  Eye,
  FileText,
  Lock,
  Scale,
  Shield,
  ShieldCheck,
  UserCheck,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { MarketingShell } from "@/components/marketing/marketing-shell"
import { PageHero } from "@/components/marketing/page-hero"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Nova Meridian collects, uses, stores and protects your information.",
}

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="Your privacy is important to us. This Privacy Policy explains how Nova Meridian collects, uses, stores, and protects your information while providing our investment platform."
      >
        <p className="text-sm text-muted-foreground">Last Updated: June 2026</p>
      </PageHero>

      
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-5 px-5 lg:px-8">

          {/* Information Collection */}
          <div className="rounded-2xl border border-border bg-card p-7 transition-colors duration-300 hover:border-brand/40 sm:p-8">
            <div className="flex items-center gap-3">
              <UserRound className="size-5 text-brand-ink" aria-hidden="true" />

              <h2 className="text-h3">
                Information We Collect
              </h2>
            </div>

            <p className="mt-6 text-[15px] leading-7 text-body">
              We collect information that you voluntarily provide when creating
              an account, completing verification processes, making deposits,
              requesting withdrawals, or contacting our support team.
            </p>

            <ul className="mt-6 space-y-3 text-muted-foreground">
              <li>• Full name and account information</li>
              <li>• Email address and contact details</li>
              <li>• Transaction and payment records</li>
              <li>• Device and browser information</li>
              <li>• Platform activity and security logs</li>
            </ul>
          </div>

          {/* Data Usage */}
          <div className="rounded-2xl border border-border bg-card p-7 transition-colors duration-300 hover:border-brand/40 sm:p-8">
            <div className="flex items-center gap-3">
              <Database className="size-5 text-brand-ink" aria-hidden="true" />

              <h2 className="text-h3">
                How We Use Your Information
              </h2>
            </div>

            <p className="mt-6 text-[15px] leading-7 text-body">
              Your information is used exclusively to operate and improve our
              platform, process transactions, verify identities, enhance
              security, and provide customer support.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              <div className="rounded-lg border border-border bg-muted/30 p-5">
                <h3 className="font-semibold text-foreground">
                  Account Management
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  Create and maintain your account securely while providing a
                  personalized experience.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-5">
                <h3 className="font-semibold text-foreground">
                  Transaction Processing
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  Verify deposits, withdrawals, investments, and reward
                  distributions.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-5">
                <h3 className="font-semibold text-foreground">
                  Fraud Prevention
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  Detect suspicious activity and protect user accounts from
                  unauthorized access.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-5">
                <h3 className="font-semibold text-foreground">
                  Customer Support
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  Respond to inquiries and provide assistance whenever you need
                  help.
                </p>
              </div>

            </div>
          </div>

          {/* Security */}
          <div className="rounded-2xl border border-border bg-card p-7 transition-colors duration-300 hover:border-brand/40 sm:p-8">
            <div className="flex items-center gap-3">
              <Lock className="size-5 text-brand-ink" aria-hidden="true" />

              <h2 className="text-h3">
                Data Protection & Security
              </h2>
            </div>

            <p className="mt-6 text-[15px] leading-7 text-body">
              We implement industry-standard technical and organizational
              measures to safeguard personal information from unauthorized
              access, disclosure, alteration, or destruction.
            </p>

            <div className="mt-8 rounded-lg border border-primary/20 bg-primary/5 p-6">
              <p className="font-medium text-foreground">
                Security Features
              </p>

              <ul className="mt-4 space-y-3 text-muted-foreground">
                <li>✓ Encrypted communications</li>
                <li>✓ Secure authentication systems</li>
                <li>✓ Continuous security monitoring</li>
                <li>✓ Access controls for sensitive information</li>
              </ul>
            </div>
          </div>

          {/* Sharing */}
          <div className="rounded-2xl border border-border bg-card p-7 transition-colors duration-300 hover:border-brand/40 sm:p-8">
            <div className="flex items-center gap-3">
              <Eye className="size-5 text-brand-ink" aria-hidden="true" />

              <h2 className="text-h3">
                Information Sharing
              </h2>
            </div>

            <p className="mt-6 text-[15px] leading-7 text-body">
              Nova Meridian does not sell personal information to
              third parties. Information may only be shared when necessary to
              provide services, comply with legal obligations, prevent fraud,
              or protect the security of our platform and users.
            </p>
          </div>

          {/* User Rights */}
          <div className="rounded-2xl border border-border bg-card p-7 transition-colors duration-300 hover:border-brand/40 sm:p-8">
            <div className="flex items-center gap-3">
              <FileText className="size-5 text-brand-ink" aria-hidden="true" />

              <h2 className="text-h3">
                Your Rights
              </h2>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              <div className="rounded-lg border border-border p-5">
                <h3 className="font-semibold text-foreground">
                  Access
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  Request access to the personal information associated with
                  your account.
                </p>
              </div>

              <div className="rounded-lg border border-border p-5">
                <h3 className="font-semibold text-foreground">
                  Correction
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  Update inaccurate or outdated information whenever necessary.
                </p>
              </div>

              <div className="rounded-lg border border-border p-5">
                <h3 className="font-semibold text-foreground">
                  Security
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  Protect your account with strong credentials and secure
                  devices.
                </p>
              </div>

              <div className="rounded-lg border border-border p-5">
                <h3 className="font-semibold text-foreground">
                  Support
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  Contact our support team for questions regarding your data or
                  privacy concerns.
                </p>
              </div>

            </div>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-brand/30 bg-brand/5 p-8 text-center">
            <h2 className="text-h2">
              Your Privacy Matters
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              We are committed to maintaining transparency and protecting your
              personal information through responsible data practices and modern
              security standards.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg"><Link href="/contact">Contact Support</Link></Button>

              <Button asChild variant="outline" size="lg"><Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home</Link></Button>
            </div>
          </div>

        </div>
      </section>
    </MarketingShell>
  )
}
