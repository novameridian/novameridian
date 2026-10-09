import { NextResponse } from "next/server"
import { seedSuperAdmin, checkSuperAdminExists } from "@/lib/seed-superadmin"

export async function GET() {
  try {
    // Check if super admin exists
    const exists = await checkSuperAdminExists()
    
    if (!exists) {
      // Seed the super admin
      const result = await seedSuperAdmin()
      return NextResponse.json({ 
        message: "Seeding attempted",
        result,
        exists: false
      })
    }
    
    return NextResponse.json({ 
      message: "Super admin already exists",
      exists: true
    })
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to check/seed super admin",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
