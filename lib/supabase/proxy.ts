import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin'

const ROLE_DASHBOARD_PATHS: Record<UserRole, string> = {
  user: '/dashboard',
  moderator: '/moderator',
  admin: '/admin',
  super_admin: '/super-admin',
}

const PROTECTED_PATHS = ['/dashboard', '/moderator', '/admin', '/super-admin', '/profile', '/orders', '/transactions', '/deposit', '/withdraw', '/invest']
const AUTH_PATHS = ['/auth/login', '/auth/sign-up']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If environment variables are not set, skip Supabase auth
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  const isAuthPath = AUTH_PATHS.some(path => pathname.startsWith(path))

  // Not logged in trying to access protected route
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Logged in user
  if (user) {
    // Get user role from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_banned')
      .eq('id', user.id)
      .single()

    const role = (profile?.role as UserRole) || 'user'
    const isBanned = profile?.is_banned || false

    // Banned user - sign out and redirect
    if (isBanned) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('error', 'banned')
      return NextResponse.redirect(url)
    }

    // Logged in user on auth pages - redirect to their dashboard
    if (isAuthPath) {
      const url = request.nextUrl.clone()
      url.pathname = ROLE_DASHBOARD_PATHS[role]
      return NextResponse.redirect(url)
    }

    // Role-based access control
    if (pathname.startsWith('/super-admin') && role !== 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = ROLE_DASHBOARD_PATHS[role]
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/admin') && !['admin', 'super_admin'].includes(role)) {
      const url = request.nextUrl.clone()
      url.pathname = ROLE_DASHBOARD_PATHS[role]
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/moderator') && !['moderator', 'admin', 'super_admin'].includes(role)) {
      const url = request.nextUrl.clone()
      url.pathname = ROLE_DASHBOARD_PATHS[role]
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
