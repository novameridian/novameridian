/**
 * Single source of truth for user-facing brand constants.
 * Internal identifiers (table names, roles, env keys) are intentionally NOT here.
 */
export const SITE_NAME = "Nova Meridian"
export const SITE_TAGLINE = "A New Direction for Your Financial Future."
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.novameridian.online").replace(/\/$/, "")
export const SUPPORT_EMAIL = "support@novameridian.online"
export const TELEGRAM_HANDLE = "Nova_Meridian_Bot"
export const TELEGRAM_URL = `https://t.me/${TELEGRAM_HANDLE}`
export const SITE_DESCRIPTION =
  "Nova Meridian is an investment platform with clearly defined plans, a transparent wallet ledger and real-time portfolio tracking. Deposits and withdrawals support CBE and Telebirr."

export const MARKETING_NAV = [
  { href: "/#platform", label: "Platform" },
  { href: "/#how", label: "How it works" },
  { href: "/#plans", label: "Plans" },
  { href: "/security", label: "Security" },
  { href: "/about", label: "About" },
] as const
