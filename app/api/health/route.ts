import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY

    const isVercelDeployment = process.env.VERCEL === "1"
    const nodeEnv = process.env.NODE_ENV || "development"

    // Basic environment check
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
      return NextResponse.json({
        status: "warning",
        message: "Supabase environment variables not configured",
        timestamp: new Date().toISOString(),
        database: "not_configured",
        environment: nodeEnv,
        deployment: isVercelDeployment ? "vercel" : "local",
        config: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          urlValid: !!(supabaseUrl && !supabaseUrl.includes("placeholder")),
        },
      })
    }

    const supabase = createServerSupabaseClient()

    // Test database connection with a simple query
    let databaseStatus = "unknown"
    let databaseError = null

    try {
      const { count, error } = await supabase.from("users").select("*", { count: "exact", head: true }).limit(1)

      if (error) {
        databaseStatus = "error"
        databaseError = error.message
      } else {
        databaseStatus = "connected"
      }
    } catch (dbError) {
      databaseStatus = "connection_failed"
      databaseError = dbError instanceof Error ? dbError.message : "Unknown database error"
    }

    const healthData = {
      status: databaseStatus === "connected" ? "healthy" : "degraded",
      message:
        databaseStatus === "connected" ? "API and database are working" : "API working but database issues detected",
      timestamp: new Date().toISOString(),
      database: databaseStatus,
      environment: nodeEnv,
      deployment: isVercelDeployment ? "vercel" : "local",
      config: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlValid: !!(supabaseUrl && !supabaseUrl.includes("placeholder")),
      },
    }

    if (databaseError) {
      healthData.databaseError = databaseError
    }

    // Return appropriate status code
    const statusCode = databaseStatus === "connected" ? 200 : 503

    return NextResponse.json(healthData, { status: statusCode })
  } catch (error) {
    console.error("[v0] Health check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        environment: process.env.NODE_ENV || "development",
        deployment: process.env.VERCEL === "1" ? "vercel" : "local",
      },
      { status: 500 },
    )
  }
}
