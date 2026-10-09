"use client"

import { useEffect, useRef } from "react"
import { seedSuperAdmin } from "@/lib/seed-superadmin"

export function SuperAdminSeeder() {
  const hasSeeded = useRef(false)

  useEffect(() => {
    if (hasSeeded.current) return
    hasSeeded.current = true

    seedSuperAdmin().then((result) => {
      if (result.success) {
        // console.log("[Nova Meridian] Super admin check complete:", result.message)
      }
    }).catch(() => {
      // Silently fail - this is just a seeding operation
    })
  }, [])

  return null
}
