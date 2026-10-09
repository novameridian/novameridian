"use server"

import { createClient } from "@supabase/supabase-js"

const SUPERADMIN_EMAIL = "superadmin@hos.com"
const SUPERADMIN_PASSWORD = "HosSuperAdmin@2025!"
const ADMIN_EMAIL = "admin@hos.com"
const ADMIN_PASSWORD = "HosAdmin@2025!"

export async function seedSuperAdmin() {
  // Check if required env vars exist
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    
    return { success: false, message: "Missing environment variables" }
  }

  // Use service role to bypass RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  try {
    
    // Check if superadmin already exists in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("email", SUPERADMIN_EMAIL)
      .single()

    if (existingProfile) {
      // Already exists, ensure it's marked as system account and super_admin role
      await supabaseAdmin
        .from("profiles")
        .update({ 
          role: "super_admin", 
          is_system_account: true,
          is_banned: false 
        })
        .eq("id", existingProfile.id)
      
      return { success: true, message: "Super admin already exists" }
    }

    // Check if user exists in auth.users but not in profiles
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = authUsers?.users?.find(u => u.email === SUPERADMIN_EMAIL)

    if (existingAuthUser) {
      // User exists in auth but not profiles - create profile
      await supabaseAdmin.from("profiles").insert({
        id: existingAuthUser.id,
        email: SUPERADMIN_EMAIL,
        full_name: "System Administrator",
        role: "super_admin",
        is_system_account: true,
        kyc_verified: true,
      })

      // Create wallet
      await supabaseAdmin.from("wallets").insert({
        user_id: existingAuthUser.id,
        balance: 0,
      })

      return { success: true, message: "Super admin profile created" }
    }

    // Create new super admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: "System Administrator",
      },
    })

    if (createError) {
      console.error("Error creating super admin:", createError)
      return { success: false, message: createError.message }
    }

    if (newUser?.user) {
      // Create profile with super_admin role and mark as system account
      await supabaseAdmin.from("profiles").insert({
        id: newUser.user.id,
        email: SUPERADMIN_EMAIL,
        full_name: "System Administrator",
        role: "super_admin",
        is_system_account: true,
        kyc_verified: true,
      })

      // Create wallet
      await supabaseAdmin.from("wallets").insert({
        user_id: newUser.user.id,
        balance: 0,
      })
      return { success: true, message: "Super admin created successfully" }
    }

    return { success: false, message: "Failed to create super admin" }
  } catch (error) {
    console.error("[NovaMeridian] Error seeding super admin:", error)
    return { success: false, message: "An error occurred" }
  }
}

export async function checkSuperAdminExists() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", SUPERADMIN_EMAIL)
    .eq("role", "super_admin")
    .single()

  return !!data
}

export async function seedAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, message: "Missing environment variables" }
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  try {
    // Check if admin already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("email", ADMIN_EMAIL)
      .single()

    if (existingProfile) {
      // Update role to admin
      await supabaseAdmin
        .from("profiles")
        .update({ role: "admin", is_system_account: true, is_banned: false })
        .eq("id", existingProfile.id)
      
      return { success: true, message: "Admin already exists" }
    }

    // Check if user exists in auth.users but not in profiles
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = authUsers?.users?.find(u => u.email === ADMIN_EMAIL)

    if (existingAuthUser) {
      await supabaseAdmin.from("profiles").insert({
        id: existingAuthUser.id,
        email: ADMIN_EMAIL,
        full_name: "Platform Administrator",
        role: "admin",
        is_system_account: true,
        kyc_verified: true,
      })

      await supabaseAdmin.from("wallets").insert({
        user_id: existingAuthUser.id,
        balance: 0,
      })

      return { success: true, message: "Admin profile created" }
    }

    // Create new admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: "Platform Administrator",
      },
    })

    if (createError) {
      console.error("Error creating admin:", createError)
      return { success: false, message: createError.message }
    }

    if (newUser?.user) {
      await supabaseAdmin.from("profiles").insert({
        id: newUser.user.id,
        email: ADMIN_EMAIL,
        full_name: "Platform Administrator",
        role: "admin",
        is_system_account: true,
        kyc_verified: true,
      })

      await supabaseAdmin.from("wallets").insert({
        user_id: newUser.user.id,
        balance: 0,
      })

      return { success: true, message: "Admin created successfully" }
    }

    return { success: false, message: "Failed to create admin" }
  } catch (error) {
    console.error("Error seeding admin:", error)
    return { success: false, message: "An error occurred" }
  }
}

export async function seedAllAdmins() {
  const superAdminResult = await seedSuperAdmin()
  const adminResult = await seedAdmin()
  
  return {
    superAdmin: superAdminResult,
    admin: adminResult,
  }
}
