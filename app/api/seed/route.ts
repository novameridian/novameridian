import { NextResponse } from "next/server"
import { seedAllAdmins } from "@/lib/seed-superadmin"

export async function POST() {
  try {
    const result = await seedAllAdmins()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error seeding admins:", error)
    return NextResponse.json({ error: "Failed to seed admins" }, { status: 500 })
  }
}

export async function GET() {
  // Allow GET for easy testing
  try {
    const result = await seedAllAdmins()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error seeding admins:", error)
    return NextResponse.json({ error: "Failed to seed admins" }, { status: 500 })
  }
}
