import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function middleware(req: any) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // Force HTTPS and WWW redirect for production mapping
  if (process.env.NODE_ENV === "production") {
    const host = req.headers.get("host") || "";
    
    // If the host doesn't start with www., or the request protocol isn't secure https
    if (!host.startsWith("www.") || req.headers.get("x-forwarded-proto") !== "https") {
      return NextResponse.redirect(`https://www.novameridian.online${pathname}`, 301); 
      // Note: 301 is a permanent redirect, which explicitly forces Google to update its layout index
    }
  }

  // 1. CRITICAL SEO EXCLUSIONS: Always allow Google to read these structural files,
  // even if maintenance mode is enabled. Otherwise, Google drops your site index.
  const isSitemap = pathname === "/sitemap.xml"
  const isRobots = pathname === "/robots.txt"
  const isFavicon = pathname === "/favicon.ico"
  const isApi = pathname.startsWith("/api")
  const isStatic = pathname.startsWith("/_next")
  const isMaintenancePage = pathname === "/maintenance"

  if (isApi || isStatic || isSitemap || isRobots || isFavicon) {
    return NextResponse.next()
  }

  // 2. Fetch system settings safely with a timeout fallback
  const url_from_env = process.env.NEXT_PUBLIC_SITE_URL
  let settings = null
  
  try {
    // Added a 3-second abort timeout so your middleware never hangs the site if the API is slow
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const res = await fetch(`${url_from_env}/api/settings`, {
      signal: controller.signal,
      next: { revalidate: 10 } // Cache for 10 seconds so it doesn't slow down user requests
    })
    
    clearTimeout(timeoutId)
    settings = await res.json().catch(() => null)
  } catch (err) {
    console.error("[Middleware Settings Fetch Error]:", err)
  }

  const maintenanceEnabled = settings?.maintenance_mode === true

  // -----------------------------------------------------------------
  // PERFORMANCE OPTIMIZATION FOR GOOGLE (When Maintenance is OFF)
  // -----------------------------------------------------------------
  // If maintenance is completely OFF and someone is visiting a public page,
  // let them pass immediately. Do not hit Supabase. This keeps Google lightning fast.
  const publicRoutes = ["/", "/about", "/contact", "/faq", "/security"]
  const isPublicRoute = publicRoutes.includes(pathname)

  if (!maintenanceEnabled) {
    if (isMaintenancePage) {
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
    if (isPublicRoute) {
      return NextResponse.next()
    }
  }

  // 3. AUTH & PROFILE CHECK
  // This runs for all dashboard routes, or when maintenance mode is active
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const role = profile?.role
    isAdmin = role === "admin" || role === "super_admin"
  }

  // -----------------------------
  // CASE 1: Maintenance ON
  // -----------------------------
  // Redirects absolutely everything to /maintenance unless you are an admin
  if (maintenanceEnabled && !isAdmin) {
    if (!isMaintenancePage) {
      url.pathname = "/maintenance"
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
