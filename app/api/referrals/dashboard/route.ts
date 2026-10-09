import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 1. ALL invited users
  const { data: invitedUsers, error: invitedError } = await supabase
    .from("profiles")
    .select("id, email, created_at")
    .eq("referred_by", user.id)

  if (invitedError) {
    return NextResponse.json({ error: invitedError.message }, { status: 500 })
  }

  // 2. ALL rewarded users (converted)
  const { data: rewards, error: rewardError } = await supabase
    .from("referral_rewards")
    .select("id, referred_user_id, reward_amount, created_at, status, available_at")
    .eq("referrer_id", user.id)

  if (rewardError) {
    return NextResponse.json({ error: rewardError.message }, { status: 500 })
  }

  const convertedSet = new Set(
    rewards
      .filter(r => r.status === "claimed" || r.status === "pending")
      .map(r => r.referred_user_id)
  )

  const totalConverted = convertedSet.size

  const totalInvited = invitedUsers.length

  const invitedIds = new Set(invitedUsers.map(u => u.id))

  const convertedIds = new Set(
    rewards.map(r => r.referred_user_id)
  )

  const totalPending = [...invitedIds].filter(
    id => !convertedIds.has(id)
  ).length

  const totalEarned = rewards.reduce((sum, r) => {
    const amt = Number(r.reward_amount)
    return sum + (isNaN(amt) ? 0 : amt)
  }, 0)

  return NextResponse.json({
    totalInvited,
    totalConverted,
    totalPending,
    totalEarned,
    invitedUsers,
    rewards,
  })
}