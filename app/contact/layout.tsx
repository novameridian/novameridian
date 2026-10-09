import type { Metadata } from "next"
import { SITE_NAME, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${SITE_NAME} for account help, deposit and withdrawal questions, and general enquiries.`,

  keywords: ["Nova Meridian contact", "investment support", "customer support", "telegram support"],

  openGraph: {
    title: `Contact | ${SITE_NAME}`,
    description: `Get in touch with the ${SITE_NAME} support team.`,
    url: `${SITE_URL}/contact`,
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },

  twitter: {
    card: "summary_large_image",
    title: `Contact | ${SITE_NAME}`,
    description: `Get in touch with the ${SITE_NAME} support team.`,
    images: ["/og-image.png"],
  },

  alternates: { canonical: `${SITE_URL}/contact` },

  robots: { index: true, follow: true },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
