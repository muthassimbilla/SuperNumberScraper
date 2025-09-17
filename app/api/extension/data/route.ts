import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// POST - Save scraped data from extension to Supabase
export async function POST(request: NextRequest) {
  try {
    const { userId, data, source } = await request.json()

    console.log("[v0] Saving scraped data:", { userId, dataCount: data.length, source })

    const phoneNumbers = data.map((phone: string) => ({
      user_id: userId,
      phone_number: phone,
      source_url: source,
      scraped_at: new Date().toISOString(),
    }))

    const { data: savedData, error } = await supabase.from("copied_numbers").insert(phoneNumbers)

    if (error) {
      console.error("[v0] Supabase insert error:", error)
      return NextResponse.json({ error: "Failed to save data" }, { status: 500 })
    }

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
      console.error("[v0] User data update error:", updateError)
    }

    return NextResponse.json({
      success: true,
      message: "Data saved successfully",
      count: data.length,
    })
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

    const userData = {
      total: count || 0,
      recent: phoneNumbers || [],
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error("[v0] Data fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}
