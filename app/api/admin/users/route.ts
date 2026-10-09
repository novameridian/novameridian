import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const url = new URL(request.url)
    const filter = url.searchParams.get("filter") || "all"
    const roleFilter = url.searchParams.get("roleFilter") || "all"

    let query = supabaseAdmin
      .from("profiles")
      .select("*")
      .neq("is_system_account", true)
      .order("created_at", { ascending: false })

    // Role filter (for admin page - only regular users, for super-admin - all)
    if (roleFilter === "users_only") {
      query = query.eq("role", "user")
    }

    // Status filters
    if (filter === "banned") {
      query = query.eq("is_banned", true)
    } else if (filter === "verified") {
      query = query.eq("kyc_verified", true)
    } else if (filter === "unverified") {
      query = query.eq("kyc_verified", false)
    } else if (filter === "user") {
      query = query.eq("role", "user")
    } else if (filter === "staff") {
      query = query.in("role", ["moderator", "admin", "super_admin"])
    }

    const { data: users, error: usersError } = await query.limit(200)

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // Fetch wallets separately
    const userIds = users?.map(u => u.id) || []
    
    let walletsData: { user_id: string; balance: number }[] = []
    if (userIds.length > 0) {
      const { data: wallets } = await supabaseAdmin
        .from("wallets")
        .select("user_id, balance")
        .in("user_id", userIds)
      walletsData = wallets || []
    }

    // Merge wallets into users
    const usersWithWallets = users?.map(user => ({
      ...user,
      wallets: walletsData.filter(w => w.user_id === user.id)
    })) || []

    return NextResponse.json({ users: usersWithWallets })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, action, value, walletAdjustment } = body

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Only super_admin can perform suspend, reactivate, and delete actions
    const isSuperAdmin = profile.role === "super_admin"

    if (action === "toggle_ban") {
      await supabaseAdmin
        .from("profiles")
        .update({ is_banned: value })
        .eq("id", userId)

      // Log action
      await supabaseAdmin.from("audit_logs").insert({
        user_id: user.id,
        action: value ? "user_banned" : "user_unbanned",
        entity_type: "user",
        entity_id: userId,
        details: { banned: value },
      })
    } else if (action === "toggle_kyc") {
      await supabaseAdmin
        .from("profiles")
        .update({ kyc_verified: value })
        .eq("id", userId)

      // Log action
      await supabaseAdmin.from("audit_logs").insert({
        user_id: user.id,
        action: "kyc_status_changed",
        entity_type: "user",
        entity_id: userId,
        details: { verified: value },
      })
    } else if (action === "suspend_user") {
      if (!isSuperAdmin) {
        return NextResponse.json({ error: "Only super admin can suspend users" }, { status: 403 })
      }

      // Suspend user: set is_banned flag
      await supabaseAdmin
        .from("profiles")
        .update({ is_banned: true })
        .eq("id", userId)

      // Log suspension
      await supabaseAdmin.from("audit_logs").insert({
        user_id: user.id,
        action: "user_suspended",
        entity_type: "user",
        entity_id: userId,
        details: { reason: "Account suspended by super admin" },
      })
    } else if (action === "reactivate_user") {
      if (!isSuperAdmin) {
        return NextResponse.json({ error: "Only super admin can reactivate users" }, { status: 403 })
      }

      // Reactivate user
      await supabaseAdmin
        .from("profiles")
        .update({ is_banned: false })
        .eq("id", userId)

      // Log reactivation
      await supabaseAdmin.from("audit_logs").insert({
        user_id: user.id,
        action: "user_reactivated",
        entity_type: "user",
        entity_id: userId,
        details: { reason: "Account reactivated by super admin" },
      })
    } else if (action === "delete_user") {
      if (!isSuperAdmin) {
        return NextResponse.json({ error: "Only super admin can delete users" }, { status: 403 })
      }

      // Get user email for future account creation
      const { data: userProfile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single()

      // Delete user's auth account (this cascades to RLS-protected tables)
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (deleteAuthError) {
        console.error("[NovaMeridian] Auth deletion error:", deleteAuthError)
        return NextResponse.json({ error: "Failed to delete user account from auth" }, { status: 500 })
      }

      // Soft-delete profile record (mark as system account to hide from lists)
      await supabaseAdmin
        .from("profiles")
        .update({ 
          is_system_account: true,
          email: `deleted-${userId}@archived.local`,
          full_name: "Deleted User",
        })
        .eq("id", userId)

      // Log deletion
      await supabaseAdmin.from("audit_logs").insert({
        user_id: user.id,
        action: "user_deleted",
        entity_type: "user",
        entity_id: userId,
        details: { 
          deleted_email: userProfile?.email,
          timestamp: new Date().toISOString(),
          action: "permanent deletion with auth account removed"
        },
      })
    } else if (action === "adjust_wallet") {
      // Only super_admin can adjust wallets
      if (profile.role !== "super_admin") {
        return NextResponse.json({ error: "Only super admin can adjust wallets" }, { status: 403 })
      }

      const amount = parseFloat(walletAdjustment)
      if (isNaN(amount)) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
      }

      // Get current balance
      const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .single()

      const currentBalance = wallet?.balance || 0
      const newBalance = currentBalance + amount

      // Update wallet
      await supabaseAdmin
        .from("wallets")
        .update({ balance: newBalance })
        .eq("user_id", userId)

      // Create transaction record
      await supabaseAdmin.from("transactions").insert({
        user_id: userId,
        type: amount > 0 ? "admin_credit" : "admin_debit",
        amount: amount,
        status: "completed",
        description: `Manual adjustment by super admin`,
        balance_before: currentBalance,
        balance_after: newBalance,
      })

      // Create audit log
      await supabaseAdmin.from("audit_logs").insert({
        user_id: user.id,
        action: "wallet_adjustment",
        entity_type: "wallet",
        entity_id: userId,
        details: { old_balance: currentBalance, new_balance: newBalance, adjustment: amount },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
