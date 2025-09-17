import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const createMockSupabaseClient = () => {
  const mockQuery = {
    select: (columns?: string, options?: any) => {
      // Handle count queries
      if (options?.count === "exact" && options?.head === true) {
        return Promise.resolve({ count: 0, error: null })
      }
      return mockQuery
    },
    insert: () => mockQuery,
    update: () => mockQuery,
    delete: () => mockQuery,
    order: () => mockQuery,
    eq: () => mockQuery,
    gte: () => mockQuery, // Added gte method
    lte: () => mockQuery, // Added lte method
    gt: () => mockQuery, // Added gt method
    lt: () => mockQuery, // Added lt method
    neq: () => mockQuery, // Added neq method
    in: () => mockQuery, // Added in method
    limit: () => mockQuery,
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null, count: 0 }),
  }

  return {
    from: () => mockQuery,
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signIn: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  }
}

// Server-side Supabase client for API routes
export const createServerSupabaseClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("[v0] Supabase environment variables not configured, using mock client")
    return createMockSupabaseClient() as any
  }

  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}
