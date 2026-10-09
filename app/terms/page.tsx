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
  title: "Terms of Service",
  description: "The terms that govern your access to and use of Nova Meridian.",
}

export default function TermsPage() {
  return (
    <MarketingShell>
      <PageHero
        eyebrow="Legal"
        title="Terms of Service"
        description="These Terms of Service govern your access to and use of Nova Meridian. By creating an account or using our platform, you agree to comply with these terms and all applicable laws."
      >
        <p className="text-sm text-muted-foreground">Last Updated: June 2026</p>
      </PageHero>

      
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-5 px-5 lg:px-8">

          <div className="rounded-2xl border border-border bg-card p-7 transition-colors duration-300 hover:border-brand/40 sm:p-8">
            <div className="flex items-center gap-3">
              <UserCheck className="size-5 text-brand-ink" aria-hidden="true" />

              <h2 className="text-h3">
                1. Account Eligibility
              </h2>
            </div>

            <p className="mt-6 text-[15px] leading-7 text-body">
              Users are responsible for ensuring that their use of the platform
              complies with local laws and regulations. By creating an account,
              you confirm that the information you provide is accurate,
              complete, and kept up to date.
            </p>

            <p className="mt-4 text-[15px] leading-7 text-body">
              You are responsible for maintaining the confidentiality of your
              login credentials and for all activities performed through your
              account.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-7 transition-colors duration-300 hover:border-brand/40 sm:p-8">
            <div className="flex items-center gap-3">
              <CreditCard className="size-5 text-brand-ink" aria-hidden="true" />

              <h2 className="text-h3">
                2. Deposits and Withdrawals
              </h2>
            </div>

            <p className="mt-6 text-[15px] leading-7 text-body">
              Deposits are credited after successful verification through the
              supported payment methods. Processing times may vary depending on
              banking systems and security reviews.
            </p>

            <p className="mt-4 text-[15px] leading-7 text-body">
              Withdrawal requests are reviewed before processing. Additional
              verification may be required to protect user accounts and prevent
              unauthorized transactions.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-7 transition-colors duration-300 hover:border-brand/40 sm:p-8">
            <div className="flex items-center gap-3">
              <Shield className="size-5 text-brand-ink" aria-hidden="true" />

              <h2 className="text-h3">
                3. Platform Security
              </h2>
            </div>

            <p className="mt-6 text-[15px] leading-7 text-body">
              Nova Meridian uses security measures designed to
              protect user accounts and transaction data. Users must not attempt
              to bypass authentication systems, interfere with platform
              operations, or access resources without authorization.
            </p>

            <p className="mt-4 text-[15px] leading-7 text-body">
              Any activity that threatens platform stability or user security
              may result in immediate account suspension or permanent
              termination.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-7 transition-colors duration-300 hover:border-brand/40 sm:p-8">
            <div className="flex items-center gap-3">
              <Scale className="size-5 text-brand-ink" aria-hidden="true" />

              <h2 className="text-h3">
                4. User Responsibilities
              </h2>
            </div>

            <ul className="mt-6 space-y-4 text-muted-foreground">
              <li>• Provide accurate registration information.</li>

              <li>• Keep account credentials secure.</li>

              <li>• Comply with all applicable laws.</li>

              <li>• Avoid fraudulent or misleading activity.</li>

              <li>• Respect the integrity and availability of the platform.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-7 transition-colors duration-300 hover:border-brand/40 sm:p-8">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-brand-ink" aria-hidden="true" />

              <h2 className="text-h3">
                5. Limitation of Liability
              </h2>
            </div>

            <p className="mt-6 text-[15px] leading-7 text-body">
              While we strive to provide reliable services and maintain platform
              availability, no online system can guarantee uninterrupted
              operation. Temporary maintenance, technical issues, or external
              events may affect access to the platform.
            </p>

            <p className="mt-4 text-[15px] leading-7 text-body">
              Users acknowledge that they are responsible for evaluating their
              own financial decisions and understanding the features available
              through the platform.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-7 transition-colors duration-300 hover:border-brand/40 sm:p-8">
            <h2 className="text-h3">
              6. Changes to These Terms
            </h2>

            <p className="mt-6 text-[15px] leading-7 text-body">
              Nova Meridian reserves the right to update or modify
              these Terms of Service at any time. Continued use of the platform
              after changes become effective constitutes acceptance of the
              updated terms.
            </p>
          </div>

          <div className="rounded-2xl border border-brand/30 bg-brand/5 p-8 text-center">
            <h2 className="text-h2">
              Questions About These Terms?
            </h2>

            <p className="mt-4 text-muted-foreground">
              If you have any questions regarding these Terms of Service, our
              support team is available to assist you.
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
