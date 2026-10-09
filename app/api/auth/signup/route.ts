import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { referralCode } = await req.json()

    if (!referralCode) {
      return NextResponse.json(
        { success: false, message: "Referral code is required" },
        { status: 400 }
      )
    }
    const code = referralCode.trim().toUpperCase()

    const supabase = await createServerClient()

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, referral_code")
      .eq("referral_code", code)
      .single()

    if (!profile) {
      return NextResponse.json({ success: false, message: "Invalid referral code" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      referrerId: profile.id,
    })
  } catch (err) {
    console.error("Signup API crash:", err)

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 }
    )
  }
}