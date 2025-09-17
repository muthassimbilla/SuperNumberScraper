import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const createMockSupabaseClient = () => {
  const createMockQuery = () => {
    const mockQuery = {
      select: (columns?: string, options?: any) => {
        // Handle count queries specifically
        if (options?.count === "exact" && options?.head === true) {
          return Promise.resolve({ count: 0, error: null, data: null })
        }
        return createMockQuery()
      },
      insert: () => createMockQuery(),
      update: () => createMockQuery(),
      delete: () => createMockQuery(),
      order: () => createMockQuery(),
      eq: () => createMockQuery(),
      gte: () => createMockQuery(),
      lte: () => createMockQuery(),
      gt: () => createMockQuery(),
      lt: () => createMockQuery(),
      neq: () => createMockQuery(),
      in: () => createMockQuery(),
      limit: () => createMockQuery(),
      single: () => Promise.resolve({ data: null, error: null }),
      // Make the query thenable so it can be awaited
      then: (resolve: any, reject?: any) => {
        const result = { data: [], error: null, count: 0 }
        return Promise.resolve(result).then(resolve, reject)
      },
    }
    return mockQuery
  }

  return {
    from: () => createMockQuery(),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signIn: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  }
}

export const testSupabaseConnection = async (url: string, key: string) => {
  try {
    console.log("[v0] Testing connection with URL:", url.substring(0, 30) + "...")
    console.log("[v0] Testing connection with key length:", key.length)

    // Check for placeholder values
    if (url.includes("placeholder") || key.includes("placeholder")) {
      const error = "Environment variables contain placeholder values"
      console.log("[v0] Connection test failed:", error)
      return { success: false, error }
    }

    const testClient = createClient(url, key)

    // Try a simple query to test the connection - use a more basic approach
    console.log("[v0] Attempting test query...")
    const { data, error } = await testClient.from("users").select("id").limit(1)

    if (error) {
      console.log("[v0] Connection test failed:", error.message)
      return { success: false, error: error.message }
    }

    console.log("[v0] Connection test successful")
    return { success: true, error: null }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown connection error"
    console.log("[v0] Connection test exception:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

export const createServerSupabaseClient = () => {
  // Check multiple environment variable patterns for Vercel deployment
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VERCEL_SUPABASE_URL

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VERCEL_SUPABASE_ANON_KEY

  const isValidUrl =
    supabaseUrl &&
    !supabaseUrl.includes("placeholder") &&
    supabaseUrl.includes("supabase.co") &&
    supabaseUrl.startsWith("https://")

  const isValidKey =
    supabaseKey &&
    !supabaseKey.includes("placeholder") &&
    supabaseKey.length > 50 && // Supabase keys are much longer than 21 chars
    (supabaseKey.startsWith("eyJ") || supabaseKey.startsWith("sbp_")) // JWT or service role key format

  console.log("[v0] Environment check:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlValid: isValidUrl,
    keyValid: isValidKey,
    keyLength: supabaseKey?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
  })

  if (!isValidUrl || !isValidKey) {
    console.warn("[v0] Supabase environment variables not properly configured, using mock client")
    console.warn("[v0] Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel Project Settings")
    return createMockSupabaseClient() as any
  }

  try {
    const cookieStore = cookies()

    return createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })
  } catch (error) {
    console.error("[v0] Failed to create Supabase client:", error)
    return createMockSupabaseClient() as any
  }
}
