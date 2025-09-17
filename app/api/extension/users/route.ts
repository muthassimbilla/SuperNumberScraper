import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET - Fetch all users from Supabase
export async function GET(request: NextRequest) {
  try {
    const { data: users, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching users:", error)
      // Return empty array if no users found instead of error
      return NextResponse.json({ users: [] })
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

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error("[v0] Error in users API:", error)
    return NextResponse.json({ users: [] })
  }
}

// POST - User action (suspend, upgrade, etc.)
export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json()

    console.log("[v0] User action:", userId, action)

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
