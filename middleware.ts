import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: req })
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // 1. Force HTTPS / WWW redirect in production
  if (process.env.NODE_ENV === "production") {
    const host = req.headers.get("host") || ""
    if (!host.startsWith("www.") || req.headers.get("x-forwarded-proto") !== "https") {
      return NextResponse.redirect(`https://www.novameridian.online${pathname}`, 301)
    }
  }

  // 2. SEO & Static Exclusions
  const isSitemap = pathname === "/sitemap.xml"
  const isRobots = pathname === "/robots.txt"
  const isFavicon = pathname === "/favicon.ico"
  const isApi = pathname.startsWith("/api")
  const isStatic = pathname.startsWith("/_next")
  const isMaintenancePage = pathname === "/maintenance"

  if (isApi || isStatic || isSitemap || isRobots || isFavicon) {
    return response
  }

  // 3. System Settings Check
  const url_from_env = process.env.NEXT_PUBLIC_SITE_URL
  let settings = null

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const res = await fetch(`${url_from_env}/api/settings`, {
      signal: controller.signal,
      next: { revalidate: 10 }
    })
    
    clearTimeout(timeoutId)
    settings = await res.json().catch(() => null)
  } catch (err) {
    console.error("[Middleware Settings Fetch Error]:", err)
  }

  const maintenanceEnabled = settings?.maintenance_mode === true
  const publicRoutes = ["/", "/about", "/contact", "/faq", "/security"]
  const isPublicRoute = publicRoutes.includes(pathname)

  if (!maintenanceEnabled) {
    if (isMaintenancePage) {
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
    if (isPublicRoute) {
      return response
    }
  }

  // 4. Instantiate Supabase Client (Correct approach for middleware)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        response = NextResponse.next({ request: req })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // 5. Auth & Role Verification
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

  if (maintenanceEnabled && !isAdmin) {
    if (!isMaintenancePage) {
      url.pathname = "/maintenance"
      return NextResponse.redirect(url)
    }
    return response
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
