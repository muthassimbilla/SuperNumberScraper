import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for browser-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client with service role for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database Tables
export const TABLES = {
  USERS: 'users',
  USER_DATA: 'user_data', 
  EXTENSION_CONFIGS: 'extension_configs',
  SUBSCRIPTIONS: 'subscriptions',
  FEATURES: 'features',
  LOGS: 'logs',
  WEBHOOKS: 'webhooks',
  SETTINGS: 'system_settings',
  NOTIFICATIONS: 'notifications',
  THEMES: 'themes',
  LAYOUTS: 'layouts'
} as const

// Auth helper for Supabase authentication
export class SupabaseAuth {
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Authentication failed'
      }
    }
  }

  static async signUp(email: string, password: string, metadata?: Record<string, any>) {
    try {
      const { data, error } = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Registration failed'
      }
    }
  }

  static async signOut() {
    try {
      const { error } = await supabaseAdmin.auth.signOut()
      
      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign out failed'
      }
    }
  }
}

// Export supabaseAuth for backward compatibility
export const supabaseAuth = SupabaseAuth;

// Helper functions for common database operations
export class SupabaseHelper {
  // User operations
  static async createUser(userData: {
    email: string
    password?: string
    subscription?: 'free' | 'premium'
    metadata?: Record<string, any>
  }) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: userData.metadata
    })

    if (error) throw error

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabaseAdmin
        .from(TABLES.USERS)
        .insert({
          id: data.user.id,
          email: userData.email,
          subscription: userData.subscription || 'free',
          is_active: true,
          metadata: userData.metadata,
          created_at: new Date().toISOString()
        })

      if (profileError) throw profileError
    }

    return data
  }

  static async getUserById(userId: string) {
    const { data, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  static async updateUserSubscription(userId: string, subscription: 'free' | 'premium', expiresAt?: string) {
    const { error } = await supabaseAdmin
      .from(TABLES.USERS)
      .update({
        subscription,
        subscription_expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error
  }

  // Extension config operations
  static async getExtensionConfig(userId?: string) {
    let query = supabaseAdmin
      .from(TABLES.EXTENSION_CONFIGS)
      .select('*')
      .eq('is_active', true)

    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      query = query.is('user_id', null) // Global config
    }

    const { data, error } = await query.single()

    if (error && error.code !== 'PGRST116') { // Not found is OK
      throw error
    }

    return data
  }

  static async createExtensionConfig(config: {
    user_id?: string
    title: string
    version: string
    theme: 'light' | 'dark'
    layout: string
    features: any[]
    badge?: any
    supabase?: any
  }) {
    const { data, error } = await supabaseAdmin
      .from(TABLES.EXTENSION_CONFIGS)
      .insert({
        ...config,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateExtensionConfig(id: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from(TABLES.EXTENSION_CONFIGS)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // User data operations
  static async saveUserData(userId: string, feature: string, data: any) {
    const { error } = await supabaseAdmin
      .from(TABLES.USER_DATA)
      .insert({
        user_id: userId,
        feature,
        data,
        created_at: new Date().toISOString()
      })

    if (error) throw error
  }

  static async getUserData(userId: string, feature?: string) {
    let query = supabaseAdmin
      .from(TABLES.USER_DATA)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (feature) {
      query = query.eq('feature', feature)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  // Feature operations
  static async getFeatures() {
    const { data, error } = await supabaseAdmin
      .from(TABLES.FEATURES)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async createFeature(feature: {
    name: string
    title: string
    type: string
    premium: boolean
    description?: string
    settings?: any
  }) {
    const { data, error } = await supabaseAdmin
      .from(TABLES.FEATURES)
      .insert({
        ...feature,
        enabled: true,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Subscription operations
  static async createSubscription(subscription: {
    user_id: string
    type: 'free' | 'premium'
    starts_at: string
    expires_at?: string
  }) {
    const { data, error } = await supabaseAdmin
      .from(TABLES.SUBSCRIPTIONS)
      .insert({
        ...subscription,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Logging operations
  static async log(entry: {
    level: 'info' | 'warn' | 'error' | 'debug'
    message: string
    user_id?: string
    feature?: string
    metadata?: Record<string, any>
  }) {
    const { error } = await supabaseAdmin
      .from(TABLES.LOGS)
      .insert({
        ...entry,
        timestamp: new Date().toISOString()
      })

    if (error) console.error('Failed to log:', error)
  }

  // Settings operations
  static async getSetting(key: string) {
    const { data, error } = await supabaseAdmin
      .from(TABLES.SETTINGS)
      .select('value, type')
      .eq('key', key)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (!data) return null

    // Parse value based on type
    switch (data.type) {
      case 'number':
        return parseFloat(data.value)
      case 'boolean':
        return data.value === 'true'
      case 'json':
        return JSON.parse(data.value)
      default:
        return data.value
    }
  }

  static async setSetting(key: string, value: any, type: 'string' | 'number' | 'boolean' | 'json' = 'string', description?: string, isPublic = false) {
    let stringValue: string

    switch (type) {
      case 'json':
        stringValue = JSON.stringify(value)
        break
      default:
        stringValue = String(value)
    }

    const { error } = await supabaseAdmin
      .from(TABLES.SETTINGS)
      .upsert({
        key,
        value: stringValue,
        type,
        description,
        is_public: isPublic,
        updated_at: new Date().toISOString()
      })

    if (error) throw error
  }

  // Dashboard stats
  static async getDashboardStats() {
    // Get user counts
    const { count: totalUsers } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('*', { count: 'exact', head: true })

    const { count: activeUsers } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: premiumUsers } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('*', { count: 'exact', head: true })
      .eq('subscription', 'premium')

    // Get feature count
    const { count: totalFeatures } = await supabaseAdmin
      .from(TABLES.FEATURES)
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      premiumUsers: premiumUsers || 0,
      totalFeatures: totalFeatures || 0,
      activeExtensions: activeUsers || 0, // Assuming active users have active extensions
      serverStatus: 'online' as const
    }
  }
}
