// Supabase Authentication and API Client for Server-Driven Extension
const SUPABASE_URL = "https://kteiqnewqmmtyuijsrgf.supabase.co"
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0ZWlxbmV3cW1tdHl1aWpzcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzU0NTQsImV4cCI6MjA2NzM1MTQ1NH0.-QgfCruUe6E7i7wvOJnCdV432yc2Xiwin7Dg11Dff98"
const chrome = window.chrome // Declare the chrome variable

class SupabaseAuth {
  constructor() {
    this.currentUser = null
    this.session = null
    this.isInitialized = false
  }

  // Initialize authentication and check for existing session
  async initialize() {
    try {
      // Check for stored session
      const storedSession = await this.getStoredSession()
      if (storedSession && this.isValidSession(storedSession)) {
        this.session = storedSession
        this.currentUser = storedSession.user

        // Verify session with server
        const isValid = await this.verifySession()
        if (!isValid) {
          await this.clearSession()
        }
      }

      this.isInitialized = true
      return this.currentUser
    } catch (error) {
      console.error("Error initializing auth:", error)
      this.isInitialized = true
      return null
    }
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error_description || data.message || "Sign in failed")
      }

      // Store session
      this.session = data
      this.currentUser = data.user
      await this.storeSession(data)

      // Create or update user record
      await this.createOrUpdateUser(data.user)

      return { user: data.user, error: null }
    } catch (error) {
      console.error("Sign in error:", error)
      return { user: null, error: error.message }
    }
  }

  // Sign up with email and password
  async signUp(email, password) {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error_description || data.message || "Sign up failed")
      }

      // If user is created and confirmed, store session
      if (data.user && data.access_token) {
        this.session = data
        this.currentUser = data.user
        await this.storeSession(data)
        await this.createOrUpdateUser(data.user)
      }

      return { user: data.user, error: null }
    } catch (error) {
      console.error("Sign up error:", error)
      return { user: null, error: error.message }
    }
  }

  // Sign out
  async signOut() {
    try {
      if (this.session?.access_token) {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${this.session.access_token}`,
          },
        })
      }
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      await this.clearSession()
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null && this.session !== null
  }

  // Get user subscription status
  async getUserSubscription() {
    if (!this.isAuthenticated()) {
      return { subscription_status: "free", expiry_date: null }
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/users?auth_id=eq.${this.currentUser.id}&select=subscription_status,expiry_date`,
        {
          method: "GET",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${this.session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch subscription")
      }

      const data = await response.json()
      return data[0] || { subscription_status: "free", expiry_date: null }
    } catch (error) {
      console.error("Error fetching subscription:", error)
      return { subscription_status: "free", expiry_date: null }
    }
  }

  // Check if user has premium access
  async hasPremiumAccess() {
    const subscription = await this.getUserSubscription()

    if (subscription.subscription_status !== "premium") {
      return false
    }

    // Check if subscription is not expired
    if (subscription.expiry_date) {
      const expiryDate = new Date(subscription.expiry_date)
      const now = new Date()
      return expiryDate > now
    }

    return true
  }

  // Create or update user record in database
  async createOrUpdateUser(user) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${this.session.access_token}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          auth_id: user.id,
          email: user.email,
          subscription_status: "free",
        }),
      })

      if (!response.ok && response.status !== 409) {
        console.error("Failed to create/update user record")
      }
    } catch (error) {
      console.error("Error creating/updating user:", error)
    }
  }

  // Store session in Chrome storage
  async storeSession(session) {
    try {
      await chrome.storage.local.set({
        supabase_session: {
          ...session,
          stored_at: Date.now(),
        },
      })
    } catch (error) {
      console.error("Error storing session:", error)
    }
  }

  // Get stored session from Chrome storage
  async getStoredSession() {
    try {
      const result = await chrome.storage.local.get(["supabase_session"])
      return result.supabase_session || null
    } catch (error) {
      console.error("Error getting stored session:", error)
      return null
    }
  }

  // Clear session from storage
  async clearSession() {
    this.session = null
    this.currentUser = null

    try {
      await chrome.storage.local.remove(["supabase_session"])
    } catch (error) {
      console.error("Error clearing session:", error)
    }
  }

  // Check if session is valid (not expired)
  isValidSession(session) {
    if (!session || !session.access_token || !session.expires_at) {
      return false
    }

    const expiresAt = session.expires_at * 1000 // Convert to milliseconds
    const now = Date.now()
    const buffer = 5 * 60 * 1000 // 5 minute buffer

    return expiresAt > now + buffer
  }

  // Verify session with server
  async verifySession() {
    if (!this.session?.access_token) {
      return false
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${this.session.access_token}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error("Error verifying session:", error)
      return false
    }
  }

  // Refresh access token
  async refreshToken() {
    if (!this.session?.refresh_token) {
      return false
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: this.session.refresh_token,
        }),
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      this.session = data
      this.currentUser = data.user
      await this.storeSession(data)

      return true
    } catch (error) {
      console.error("Error refreshing token:", error)
      return false
    }
  }
}

// Server-driven API client
class ServerDrivenAPI {
  constructor(auth) {
    this.auth = auth
  }

  // Get UI configuration from server
  async getUIConfig() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/ui_config?is_active=eq.true&order=version.desc&limit=1`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: this.auth.session ? `Bearer ${this.auth.session.access_token}` : `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch UI config")
      }

      const data = await response.json()
      return data[0] || this.getDefaultUIConfig()
    } catch (error) {
      console.error("Error fetching UI config:", error)
      return this.getDefaultUIConfig()
    }
  }

  // Get default UI configuration
  getDefaultUIConfig() {
    return {
      version: 1,
      layout: "dashboard",
      features: [
        {
          name: "phone_scraper",
          title: "Phone Number Scraper",
          type: "button",
          premium: false,
          icon: "phone",
        },
      ],
      theme: "light",
    }
  }

  // Execute feature on server
  async runFeature(featureName, input = {}) {
    if (!this.auth.isAuthenticated()) {
      throw new Error("Authentication required")
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/run-feature`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${this.auth.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: this.auth.currentUser.id,
          feature: featureName,
          input: input,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Feature execution failed")
      }

      return await response.json()
    } catch (error) {
      console.error("Error running feature:", error)
      throw error
    }
  }

  // Save user data
  async saveUserData(feature, data) {
    if (!this.auth.isAuthenticated()) {
      throw new Error("Authentication required")
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/user_data`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${this.auth.session.access_token}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          user_id: this.auth.currentUser.id,
          feature: feature,
          data: data,
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Error saving user data:", error)
      return false
    }
  }

  // Get user data
  async getUserData(feature = null) {
    if (!this.auth.isAuthenticated()) {
      return []
    }

    try {
      let url = `${SUPABASE_URL}/rest/v1/user_data?user_id=eq.${this.auth.currentUser.id}&order=created_at.desc`
      if (feature) {
        url += `&feature=eq.${feature}`
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${this.auth.session.access_token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch user data")
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching user data:", error)
      return []
    }
  }
}

// Global instances
window.supabaseAuth = new SupabaseAuth()
window.serverAPI = new ServerDrivenAPI(window.supabaseAuth)

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = { SupabaseAuth, ServerDrivenAPI }
}
