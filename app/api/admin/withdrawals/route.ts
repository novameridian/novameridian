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

    const url = new URL(request.url)
    const filter = url.searchParams.get("filter") || "all"

    let query = supabaseAdmin
      .from("withdrawals")
      .select("id, user_id, amount, payment_method, status, method, account_details, notes, created_at, updated_at")
      .order("created_at", { ascending: false })

    if (filter !== "all") {
      query = query.eq("status", filter)
    }

    const { data: withdrawalsData, error: withdrawalsError } = await query.limit(100)

    if (withdrawalsError) {
      console.error("[NovaMeridian] Error fetching withdrawals:", withdrawalsError)
      return NextResponse.json({ error: withdrawalsError.message }, { status: 500 })
    }

    // Fetch profiles separately to avoid join issues
    let withdrawals = withdrawalsData || []
    
    if (withdrawals.length > 0) {
      const userIds = withdrawals.map((w: any) => w.user_id)
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds)

      if (!profilesError && profiles) {
        const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]))
        withdrawals = withdrawals.map((w: any) => ({
          ...w,
          profiles: profileMap[w.user_id] || null,
        }))
      }
    }
    return NextResponse.json({ withdrawals })
  } catch (error) {
    console.error("[NovaMeridian] Error in withdrawals API:", error)
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
    const { withdrawalId, action, adminNotes } = body

    if (!withdrawalId || !action) {
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

    // Check if withdrawal is still pending
    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single()

    if (fetchError || !withdrawal) {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 })
    }

    if (withdrawal.status !== "pending") {
      return NextResponse.json({ error: "Withdrawal already processed" }, { status: 400 })
    }

    const newStatus = action === "approve" ? "approved" : "rejected"

    // Update withdrawal status
    const { error: updateError } = await supabaseAdmin
      .from("withdrawals")
      .update({ status: newStatus, notes: adminNotes })
      .eq("id", withdrawalId)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update withdrawal" }, { status: 500 })
    }

    if (action === "approve") {
      // Fetch current wallet to get balance_before for transaction record
      const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("balance")
        .eq("user_id", withdrawal.user_id)
        .single()

      const balanceBefore = wallet?.balance || 0

      // Create transaction record (balance was already deducted when user submitted)
      const { error: transactionError } = await supabaseAdmin.from("transactions").update({
        status: "completed",
        balance_before: balanceBefore,
        balance_after: balanceBefore - withdrawal.amount,
        description: `Withdrawal approved via ${withdrawal.payment_method}`,
      })
      .eq("reference_id", withdrawal.id)
      .eq("type", "withdrawal")

      if (transactionError) {
        console.error("[NovaMeridian] Failed to create transaction record:", transactionError)
      }

      const { error: auditError } = await supabaseAdmin.from("audit_logs").insert({
        user_id: user.id,
        action: "withdrawal_approved",
        entity_type: "withdrawal",
        entity_id: withdrawalId,
        details: { amount: withdrawal.amount, user_id: withdrawal.user_id, approved_at: new Date().toISOString() },
      })

      if (auditError) {
        console.error("[NovaMeridian] Failed to create audit log:", auditError)
      }
      return NextResponse.json({ success: true })
    } else {
      // Rejected - refund to wallet
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from("wallets")
        .select("balance, total_withdrawn")
        .eq("user_id", withdrawal.user_id)
        .single()

      if (walletError || !wallet) {
        await supabaseAdmin.from("withdrawals").update({ status: "pending" }).eq("id", withdrawalId)
        return NextResponse.json({ error: "Failed to find wallet" }, { status: 500 })
      }

      const newBalance = wallet.balance + withdrawal.amount
      const newTotalwithdraw = wallet.total_withdrawn - withdrawal.amount
      const { error: balanceError } = await supabaseAdmin
        .from("wallets")
        .update({ balance: newBalance, total_withdrawn: newTotalwithdraw })
        .eq("user_id", withdrawal.user_id)

      if (balanceError) {
        await supabaseAdmin.from("withdrawals").update({ status: "pending" }).eq("id", withdrawalId)
        return NextResponse.json({ error: "Failed to refund balance" }, { status: 500 })
      }

      const { error: rejectionTransactionError } = await supabaseAdmin.from("transactions").update({
        status: "rejected",
        balance_before: wallet.balance,
        balance_after: newBalance,
        description: `Withdrawal rejected - funds refunded. ${adminNotes || 'No reason provided'}`,
      })
      .eq("reference_id", withdrawal.id)
      .eq("type", "withdrawal")

      if (rejectionTransactionError) {
        console.error("[NovaMeridian] Failed to create rejection transaction:", rejectionTransactionError)
      }

      const { error: rejectionAuditError } = await supabaseAdmin.from("audit_logs").insert({
        user_id: user.id,
        action: "withdrawal_rejected",
        entity_type: "withdrawal",
        entity_id: withdrawalId,
        details: { amount: withdrawal.amount, user_id: withdrawal.user_id, reason: adminNotes, refunded_balance: newBalance, rejected_at: new Date().toISOString() },
      })

      if (rejectionAuditError) {
        console.error("[NovaMeridian] Failed to create rejection audit log:", rejectionAuditError)
      }
      return NextResponse.json({ success: true, newBalance })
    }
  } catch (error) {
    console.error("Error in withdrawals PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
