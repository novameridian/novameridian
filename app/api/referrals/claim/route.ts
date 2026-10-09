import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { rewardId } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const admin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // ------------------------------------
    // Get available rewards
    // ------------------------------------

    const { data: rewards, error: rewardError } = await admin
      .from("referral_rewards")
      .select("*")
      .eq("referrer_id", user.id)
      .eq("id", rewardId)
      .eq("status", "pending")
      .lte("available_at", new Date().toISOString())

    if (rewardError) {
      console.error(rewardError)

      return NextResponse.json(
        { error: rewardError.message },
        { status: 500 }
      )
    }

    if (!rewards || rewards.length === 0) {
      return NextResponse.json(
        { error: "No rewards available yet." },
        { status: 400 }
      )
    }

    // ------------------------------------
    // Calculate total reward
    // ------------------------------------

    const totalReward = rewards.reduce(
      (sum, reward) => sum + Number(reward.reward_amount),
      0
    )

    // ------------------------------------
    // Get wallet
    // ------------------------------------

    const { data: wallet, error: walletError } = await admin
      .from("wallets")
      .select("id,balance,total_earned")
      .eq("user_id", user.id)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json(
        { error: "Wallet not found." },
        { status: 500 }
      )
    }

    const oldBalance = Number(wallet.balance || 0)
    const newBalance = oldBalance + totalReward
    //const newTotalEarned =
      //Number(wallet.total_earned || 0) + totalReward

    // ------------------------------------
    // Update wallet
    // ------------------------------------

    const { error: updateWalletError } = await admin
      .from("wallets")
      .update({
        balance: newBalance,
        //total_earned: newTotalEarned,
      })
      .eq("id", wallet.id)

    if (updateWalletError) {
      return NextResponse.json(
        { error: updateWalletError.message },
        { status: 500 }
      )
    }

    // ------------------------------------
    // Create transaction
    // ------------------------------------

    const { error: txError } = await admin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "referral_reward",
        amount: totalReward,
        balance_before: oldBalance,
        balance_after: newBalance,
        description: `Claimed ${rewards.length} referral reward(s)`,
        status: "completed",
      })

    if (txError) {
      console.error(txError)
    }

    // ------------------------------------
    // Mark rewards claimed
    // ------------------------------------

    const rewardIds = rewards.map((r) => r.id)

    const { error: claimError } = await admin
      .from("referral_rewards")
      .update({
        status: "claimed",
        claimed_at: new Date().toISOString(),
      })
      .in("id", rewardIds)

    if (claimError) {
      return NextResponse.json(
        { error: claimError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      claimed: rewards.length,
      amount: totalReward,
      newBalance,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
