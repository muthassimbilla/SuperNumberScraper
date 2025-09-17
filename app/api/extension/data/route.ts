import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

// POST - Save scraped data from extension to Supabase
export async function POST(request: NextRequest) {
  try {
    const { userId, data, source } = await request.json()

    console.log("[v0] Saving scraped data:", { userId, dataCount: data?.length || 0, source })

    if (!userId || !data || !Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const hasSupabaseConfig = !!(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    )

    if (!hasSupabaseConfig) {
      console.log("[v0] No Supabase config, simulating data save")
      return NextResponse.json({
        success: true,
        message: "Data saved successfully (simulated)",
        count: data.length,
      })
    }

    const phoneNumbers = data.map((phone: string) => ({
      user_id: userId,
      phone_number: phone,
      source_url: source || "unknown",
      scraped_at: new Date().toISOString(),
    }))

    try {
      const { data: savedData, error } = await supabase.from("copied_numbers").insert(phoneNumbers)

      if (error) {
        console.error("[v0] Supabase insert error:", error)
        return NextResponse.json({ error: "Failed to save data" }, { status: 500 })
      }

      // Update user statistics
      const { error: updateError } = await supabase.from("user_data").upsert(
        {
          user_id: userId,
          total_scraped: data.length,
          last_activity: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )

      if (updateError) {
        console.warn("[v0] User data update error:", updateError)
      }

      return NextResponse.json({
        success: true,
        message: "Data saved successfully",
        count: data.length,
      })
    } catch (dbError) {
      console.error("[v0] Database operation failed:", dbError)
      return NextResponse.json({ error: "Database operation failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Data save error:", error)
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 })
  }
}

// GET - Fetch user's scraped data from Supabase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const hasSupabaseConfig = !!(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    )

    if (!hasSupabaseConfig) {
      console.log("[v0] No Supabase config, returning empty data")
      return NextResponse.json({
        total: 0,
        recent: [],
      })
    }

    try {
      const { data: phoneNumbers, error } = await supabase
        .from("copied_numbers")
        .select("*")
        .eq("user_id", userId)
        .order("scraped_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("[v0] Supabase fetch error:", error)
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
      }

      const { count, error: countError } = await supabase
        .from("copied_numbers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

      if (countError) {
        console.warn("[v0] Count fetch error:", countError)
      }

      const userData = {
        total: count || 0,
        recent: phoneNumbers || [],
      }

      console.log("[v0] Data fetched successfully for user:", userId, "total:", userData.total)
      return NextResponse.json(userData)
    } catch (dbError) {
      console.error("[v0] Database fetch failed:", dbError)
      return NextResponse.json({ error: "Database fetch failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Data fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}
