import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function safeSettingValue(value: any) {
  if (value === null || value === undefined) return null

  if (typeof value === "string") {
    return value.replace(/"/g, "").trim()
  }

  if (typeof value === "boolean") return value
  if (typeof value === "number") return value
  if (typeof value === "object") return value

  return value
}

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("platform_settings")
    .select("key, value")

  if (error) {
    console.error("settings fetch error:", error)
    return NextResponse.json(
      { maintenance_mode: false, maintenance_message: "" },
      { status: 200 }
    )
  }

  const settings = Object.fromEntries(
    (data || []).map((item) => [
      item.key,
      safeSettingValue(item.value),
    ])
  )

  const maintenanceMode =
    settings.maintenance_mode === true ||
    settings.maintenance_mode === "true"

  return NextResponse.json({
    maintenance_mode: maintenanceMode,
    maintenance_message: settings.maintenance_message || "",
    raw: settings, // optional debug
  })
}