import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// POST - Verify extension authentication token with Supabase
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.error("[v0] Token verification failed:", error)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (profileError) {
      console.error("[v0] Profile fetch error:", profileError)
      // Create basic profile if doesn't exist
      await supabase.from("users").insert({
        id: user.id,
        email: user.email,
        subscription: "free",
        created_at: new Date().toISOString(),
      })
    }

    console.log("[v0] Token verification successful for user:", user.id)

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        subscription: profile?.subscription || "free",
      },
    })
  } catch (error) {
    console.error("[v0] Token verification error:", error)
    return NextResponse.json({ error: "Token verification failed" }, { status: 500 })
  }
}
