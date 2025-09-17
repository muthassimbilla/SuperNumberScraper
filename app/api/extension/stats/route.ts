import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    // Fetch real statistics from Supabase
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    }

    // Get total users count
    const usersResponse = await fetch(`${supabaseUrl}/rest/v1/users?select=count`, {
      headers: { ...headers, Prefer: "count=exact" },
    })
    const usersCount = usersResponse.headers.get("content-range")?.split("/")[1] || "0"

    // Get active users (last 24 hours)
    const activeUsersResponse = await fetch(
      `${supabaseUrl}/rest/v1/users?select=count&last_active=gte.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`,
      { headers: { ...headers, Prefer: "count=exact" } },
    )
    const activeUsersCount = activeUsersResponse.headers.get("content-range")?.split("/")[1] || "0"

    // Get scraped data count
    const dataResponse = await fetch(`${supabaseUrl}/rest/v1/user_data?select=count`, {
      headers: { ...headers, Prefer: "count=exact" },
    })
    const dataCount = dataResponse.headers.get("content-range")?.split("/")[1] || "0"

    // Calculate API calls (approximate from user_data entries)
    const apiCalls = Number.parseInt(dataCount) * 2 // Rough estimate

    const stats = {
      totalUsers: Number.parseInt(usersCount),
      activeUsers: Number.parseInt(activeUsersCount),
      dataScraped: Number.parseInt(dataCount),
      apiCalls: apiCalls,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("[v0] Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
