"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Supabase password-recovery links land on "/" with a hash fragment.
 * Behavior is unchanged from the original homepage: forward them to /reset-password.
 */
export function RecoveryRedirect() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes("type=recovery")) {
      router.replace("/reset-password" + hash)
    }
  }, [router])

  return null
}
