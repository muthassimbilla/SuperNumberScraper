import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

const getDefaultConfig = () => ({
  enabled: true,
  features: {
    phoneScrapingEnabled: true,
    autoSaveEnabled: true,
    realTimeSync: true,
  },
  uiConfig: {
    theme: "light",
    showStats: true,
    compactMode: false,
  },
  ui: {
    features: [
      {
        id: "phone-scraper",
        title: "Phone Scraper",
        description: "Extract phone numbers from web pages",
        enabled: true,
        premium: false,
        icon: "phone",
      },
      {
        id: "data-export",
        title: "Data Export",
        description: "Export scraped data to CSV/Excel",
        enabled: true,
        premium: true,
        icon: "download",
      },
      {
        id: "auto-save",
        title: "Auto Save",
        description: "Automatically save scraped data",
        enabled: true,
        premium: false,
        icon: "save",
      },
    ],
  },
})

// GET - Fetch extension configuration from Supabase
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const hasSupabaseConfig = !!(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    )

    if (!hasSupabaseConfig) {
      console.log("[v0] No Supabase config, returning default config")
      return NextResponse.json({ config: getDefaultConfig() })
    }

    const { data: config, error } = await supabase.from("ui_config").select("*").eq("active", true).single()

    if (error || !config) {
      console.log("[v0] No config found in database, returning default config")
      return NextResponse.json({ config: getDefaultConfig() })
    }

    console.log("[v0] Config fetched successfully from database")
    return NextResponse.json({ config: config.config_data })
  } catch (error) {
    console.error("[v0] Config fetch error:", error)
    // Return default config instead of error
    return NextResponse.json({ config: getDefaultConfig() })
  }
}

// POST - Update extension configuration in Supabase
export async function POST(request: NextRequest) {
  try {
    const { config } = await request.json()
    const supabase = createServerSupabaseClient()

    const hasSupabaseConfig = !!(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    )

    if (!hasSupabaseConfig) {
      console.log("[v0] No Supabase config, simulating config update success")
      return NextResponse.json({ success: true, message: "Configuration updated (simulated)" })
    }

    const { data, error } = await supabase.from("ui_config").upsert(
      {
        id: "default",
        config_data: config,
        active: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    )

    if (error) {
      console.error("[v0] Supabase config update error:", error)
      return NextResponse.json({ error: "Failed to update config" }, { status: 500 })
    }

    console.log("[v0] Extension config updated in Supabase")
    return NextResponse.json({ success: true, message: "Configuration updated" })
  } catch (error) {
    console.error("[v0] Config update error:", error)
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 })
  }
}
