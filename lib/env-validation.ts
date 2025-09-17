export const validateEnvironment = () => {
  const requiredEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  const missing = Object.entries(requiredEnvVars)
    .filter(([key, value]) => {
      if (!value || value.includes("placeholder")) return true

      // Additional validation for URL format
      if (key.includes("URL") && !value.includes("supabase")) return true

      // Additional validation for key length (Supabase keys are typically long)
      if (key.includes("KEY") && value.length < 20) return true

      return false
    })
    .map(([key]) => key)

  const isValid = missing.length === 0

  return {
    isValid,
    missing,
    hasPartialConfig: Object.values(requiredEnvVars).some((v) => v && !v.includes("placeholder")),
    environment: process.env.NODE_ENV || "development",
    isVercel: process.env.VERCEL === "1",
  }
}

export const getEnvironmentStatus = () => {
  const validation = validateEnvironment()

  if (validation.isValid) {
    return { status: "configured", message: "All environment variables are set" }
  }

  if (validation.hasPartialConfig) {
    return {
      status: "partial",
      message: `Missing environment variables: ${validation.missing.join(", ")}`,
      missing: validation.missing,
    }
  }

  return {
    status: "missing",
    message: "Supabase environment variables not configured",
    missing: validation.missing,
  }
}
