import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { de, tr } from "date-fns/locale"

export async function GET(request: Request) {
  try {
    // First verify the user is an admin using regular client
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check for required env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[NovaMeridian] Missing env vars for admin client")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Use service role to fetch all deposits
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const url = new URL(request.url)
    const filter = url.searchParams.get("filter") || "all"

    let query = supabaseAdmin
      .from("deposits")
      .select("id, user_id, amount, payment_method, status, notes, created_at, updated_at, method")
      .order("created_at", { ascending: false })

    if (filter !== "all") {
      query = query.eq("status", filter)
    }

    const { data: depositsData, error: depositsError } = await query.limit(100)

    if (depositsError) {
      console.error("[NovaMeridian] Error fetching deposits:", depositsError)
      return NextResponse.json({ error: depositsError.message }, { status: 500 })
    }

    // Fetch profiles separately to avoid join issues
    let deposits = depositsData || []
    
    if (deposits.length > 0) {
      const userIds = deposits.map((d: any) => d.user_id)
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds)

      if (!profilesError && profiles) {
        const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]))
        deposits = deposits.map((d: any) => ({
          ...d,
          profiles: profileMap[d.user_id] || null,
        }))
      }
    }
    return NextResponse.json({ deposits })
  } catch (error) {
    console.error("[NovaMeridian] Error in deposits API:", error)
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
    const { depositId, action, adminNotes } = body

    if (!depositId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check for required env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[NovaMeridian] Missing env vars for admin client")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if deposit is still pending
    const { data: deposit, error: fetchError } = await supabaseAdmin
      .from("deposits")
      .select("*")
      .eq("id", depositId)
      .single()

    if (fetchError || !deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 })
    }

    if (deposit.status !== "pending") {
      return NextResponse.json({ error: "Deposit already processed" }, { status: 400 })
    }

    const newStatus = action === "approve" ? "approved" : "rejected"

    // Update deposit status
    const { error: updateError, data: updateData } = await supabaseAdmin
      .from("deposits")
      .update({ 
        status: newStatus, 
        notes: adminNotes,
        updated_at: new Date().toISOString()
      })
      .eq("id", depositId)
      .select()

    if (updateError) {
      console.error("[NovaMeridian] Failed to update deposit:", updateError)
      return NextResponse.json({ error: "Failed to update deposit: " + updateError.message }, { status: 500 })
    }

    // If approved, add to wallet
    if (action === "approve") {
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from("wallets")
        .select("id, balance, total_deposited")
        .eq("user_id", deposit.user_id)
        .single()

      if (walletError || !wallet) {
        console.error("[NovaMeridian] Failed to find wallet:", walletError)
        // Rollback
        await supabaseAdmin.from("deposits").update({ status: "pending" }).eq("id", depositId)
        return NextResponse.json({ error: "Failed to find wallet: " + (walletError?.message || "No wallet found") }, { status: 500 })
      }

      const newBalance = Number(wallet.balance || 0) + Number(deposit.amount)
      const newTotalDeposits = Number(wallet.total_deposited || 0) + Number(deposit.amount)
      const { error: balanceError } = await supabaseAdmin
        .from("wallets")
        .update({ balance: newBalance, total_deposited: newTotalDeposits, updated_at: new Date().toISOString() })
        .eq("id", wallet.id)
        .select()

      if (balanceError) {
        console.error("[NovaMeridian] Failed to update wallet balance:", balanceError)
        await supabaseAdmin.from("deposits").update({ status: "pending" }).eq("id", depositId)
        return NextResponse.json({ error: "Failed to update balance: " + balanceError.message }, { status: 500 })
      }

      try {

        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("referred_by")
          .eq("id", deposit.user_id)
          .single()

        const referrerId = profile?.referred_by

        if (!referrerId) {
          console.log("[referral] NO REFERRER → exit")
        }

        const { count, error: countError } = await supabaseAdmin
          .from("deposits")
          .select("*", { count: "exact", head: true })
          .eq("user_id", deposit.user_id)
          .eq("status", "approved")

        const isFirstDeposit = (count ?? 0) === 1

        if (!isFirstDeposit) {
          console.log("[referral] NOT FIRST DEPOSIT")
        }

        const rewardAmount = Number(deposit.amount) * 0.1

        const { data, error } = await supabaseAdmin
          .from("referral_rewards")
          .insert({
            referrer_id: referrerId,
            referred_user_id: deposit.user_id,
            deposit_id: deposit.id,
            deposit_amount: deposit.amount,
            reward_percentage: 10,
            reward_amount: rewardAmount,
          })
          .select()
          .single()
      } catch (err) {
        console.error("[referral] CRASHED:", err)
      }

      const txStatus = action === "approve" ? "completed" : "cancelled"

      // Create transaction record with balance tracking
      await supabaseAdmin
        .from("transactions")
        .update({
          status: txStatus,
          balance_before: wallet.balance,
          balance_after: newBalance,
          description: `Deposit approved via ${deposit.payment_method}`,
        })
        .eq("reference_id", deposit.id)
        .eq("type", "deposit")
        .select()


      // Log audit
      const { error: auditError } = await supabaseAdmin
        .from("audit_logs")
        .insert({
          user_id: user.id,
          action: "deposit_approved",
          entity_type: "deposit",
          entity_id: depositId,
          details: { amount: deposit.amount, user_id: deposit.user_id, new_balance: newBalance },
          created_at: new Date().toISOString(),
        })

      if (auditError) {
        console.warn("[NovaMeridian] Failed to log audit:", auditError)
      }

      return NextResponse.json({ success: true, newBalance })
    } else {
      
      // Rejected - just log
      const { data: walletForRejection } = await supabaseAdmin
        .from("wallets")
        .select("balance")
        .eq("user_id", deposit.user_id)
        .single()

      await supabaseAdmin
        .from("transactions")
        .update({
          status: "cancelled",
          description: `Deposit rejected - ${adminNotes || 'No reason provided'}`,
        })
        .eq("reference_id", deposit.id)
        .eq("type", "deposit")



      const { error: auditError } = await supabaseAdmin
        .from("audit_logs")
        .insert({
          user_id: user.id,
          action: "deposit_rejected",
          entity_type: "deposit",
          entity_id: depositId,
          details: { amount: deposit.amount, user_id: deposit.user_id, reason: adminNotes },
          created_at: new Date().toISOString(),
        })

      if (auditError) {
        console.warn("[NovaMeridian] Failed to log rejection audit:", auditError)
      }

      console.log("[NovaMeridian] Deposit rejected successfully")
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("Error in deposits PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
