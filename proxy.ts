import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone()
  const { pathname } = url
  const host = req.headers.get("host") ?? ""

  // Only canonicalize the bare production domain; leave *.vercel.app alone
  if (host === "novameridian.online") {
    return NextResponse.redirect(`https://www.novameridian.online${pathname}${url.search}`, 301)
  }

  if (
    pathname.startsWith("/api") || pathname.startsWith("/_next") ||
    ["/sitemap.xml", "/robots.txt", "/favicon.ico"].includes(pathname)
  ) return NextResponse.next()

  const isMaintenancePage = pathname === "/maintenance"
  const publicRoutes = ["/", "/about", "/contact", "/faq", "/security"]

  let maintenanceEnabled = false
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`${req.nextUrl.origin}/api/settings`, {
      signal: controller.signal,
      next: { revalidate: 10 },
    })
    clearTimeout(t)
    if (res.ok) maintenanceEnabled = (await res.json())?.maintenance_mode === true
  } catch (err) {
    console.error("[middleware] settings fetch failed:", err)
  }

  if (!maintenanceEnabled) {
    if (isMaintenancePage) { url.pathname = "/dashboard"; return NextResponse.redirect(url) }
    if (publicRoutes.includes(pathname)) return NextResponse.next()
  }

  const res = NextResponse.next({ request: req })
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (list) => list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    let isAdmin = false
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
    }
    if (maintenanceEnabled && !isAdmin && !isMaintenancePage) {
      url.pathname = "/maintenance"
      return NextResponse.redirect(url)
    }
  } catch (err) {
    console.error("[middleware] auth check failed:", err)
  }
  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
