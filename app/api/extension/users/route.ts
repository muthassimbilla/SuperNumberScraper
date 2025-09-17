import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getEnvironmentStatus } from "@/lib/env-validation"

// GET - Fetch all users from Supabase
export async function GET(request: NextRequest) {
  try {
    const envStatus = getEnvironmentStatus()

    if (envStatus.status !== "configured") {
      console.warn("[v0] Environment issue:", envStatus.message)

      return NextResponse.json({
        users: [],
        warning: envStatus.message,
        environmentStatus: envStatus.status,
        missingVars: envStatus.missing || [],
      })
    }

    const supabase = createServerSupabaseClient()

    console.log("[v0] Attempting to fetch users from Supabase...")
    const { data: users, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching users:", error.message)

      if (
        error.message.includes("Invalid API key") ||
        error.message.includes("unauthorized") ||
        error.message.includes("JWT") ||
        error.message.includes("authentication")
      ) {
        return NextResponse.json(
          {
            users: [],
            error: "Invalid Supabase credentials detected. Please verify your environment variables are correct.",
            environmentStatus: "invalid_credentials",
            suggestion:
              "Check that NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are properly set in Vercel Project Settings.",
          },
          { status: 401 },
        )
      }

      if (error.message.includes("relation") || error.message.includes("does not exist")) {
        return NextResponse.json(
          {
            users: [],
            error: "Database table 'users' not found. Please run the database setup script first.",
            environmentStatus: "missing_table",
          },
          { status: 404 },
        )
      }

      return NextResponse.json(
        {
          users: [],
          error: error.message,
          environmentStatus: "database_error",
        },
        { status: 500 },
      )
    }

    // Format users data for frontend
    const formattedUsers =
      users?.map((user) => ({
        id: user.id,
        email: user.email,
        subscription: user.subscription || "free",
        status: user.status || "active",
        last_active: user.last_active || "Never",
        created_at: user.created_at,
      })) || []

    console.log("[v0] Users fetched successfully:", formattedUsers.length, "users")
    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error("[v0] Error in users API:", error)
    return NextResponse.json(
      {
        users: [],
        error: "API error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST - User action (suspend, upgrade, etc.)
export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json()

    console.log("[v0] User action:", userId, action)

    const supabase = createServerSupabaseClient()

    const hasSupabaseConfig = !!(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    )

    if (!hasSupabaseConfig) {
      console.log("[v0] No Supabase config, simulating user action success")
      return NextResponse.json({ success: true, message: `User ${action} simulated (no database)` })
    }

    let updateData: any = {}

    switch (action) {
      case "suspend":
        updateData = { status: "suspended" }
        break
      case "activate":
        updateData = { status: "active" }
        break
      case "upgrade":
        updateData = { subscription: "premium" }
        break
      case "downgrade":
        updateData = { subscription: "free" }
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const { error } = await supabase.from("users").update(updateData).eq("id", userId)

    if (error) {
      console.error("[v0] Error updating user:", error)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `User ${action} successful` })
  } catch (error) {
    console.error("[v0] Error in user action:", error)
    return NextResponse.json({ error: "Failed to perform user action" }, { status: 500 })
  }
}
