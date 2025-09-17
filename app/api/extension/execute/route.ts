import { type NextRequest, NextResponse } from "next/server"

// POST - Execute feature from extension
export async function POST(request: NextRequest) {
  try {
    const { featureId } = await request.json()
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // In production, verify the JWT token and get user info
    const token = authHeader.replace("Bearer ", "")
    console.log("[v0] Feature execution request:", featureId, "from token:", token.substring(0, 10) + "...")

    // Define feature actions based on web control panel configuration
    const featureActions = {
      "phone-scraper": {
        action: "scrape",
        message: "Starting phone number extraction...",
      },
      "data-export": {
        action: "redirect",
        url: "https://your-domain.com/dashboard?tab=export",
        message: "Opening data export page...",
      },
      "data-view": {
        action: "redirect",
        url: "https://your-domain.com/dashboard?tab=data",
        message: "Opening data viewer...",
      },
      "auto-save": {
        action: "scrape",
        autoSave: true,
        message: "Auto-save enabled for scraping...",
      },
    }

    const featureAction = featureActions[featureId]

    if (!featureAction) {
      return NextResponse.json({ error: "Unknown feature" }, { status: 400 })
    }

    // Log feature usage for analytics
    console.log("[v0] Feature executed:", featureId, "by user")

    return NextResponse.json(featureAction)
  } catch (error) {
    console.error("[v0] Feature execution error:", error)
    return NextResponse.json({ error: "Failed to execute feature" }, { status: 500 })
  }
}
