import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

// POST - Verify extension authentication token with Supabase
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const supabase = createServerSupabaseClient()

    const hasSupabaseConfig = !!(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    )

    if (!hasSupabaseConfig) {
      console.log("[v0] No Supabase config, simulating token verification")
      return NextResponse.json({
        valid: true,
        user: {
          id: "mock-user-id",
          email: "mock@example.com",
          subscription: "free",
        },
      })
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.error("[v0] Token verification failed:", error)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    let profile = null
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("[v0] Profile fetch error:", profileError)
      } else {
        profile = profileData
      }

      // Create basic profile if doesn't exist
      if (!profile) {
        const { error: insertError } = await supabase.from("users").insert({
          id: user.id,
          email: user.email,
          subscription: "free",
          status: "active",
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
        })

        if (insertError) {
          console.error("[v0] Profile creation error:", insertError)
        }
      }
    } catch (profileError) {
      console.warn("[v0] Profile operations failed:", profileError)
    }

    console.log("[v0] Token verification successful for user:", user.id)

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        subscription: profile?.subscription || "free",
        status: profile?.status || "active",
      },
    })
  } catch (error) {
    console.error("[v0] Token verification error:", error)
    return NextResponse.json({ error: "Token verification failed" }, { status: 500 })
  }
}
