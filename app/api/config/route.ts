import { NextRequest, NextResponse } from 'next/server'
import { SupabaseHelper } from '@/lib/supabase'
import { AuthManager } from '@/lib/auth'
import { ExtensionConfig } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    // Check if user_id is provided and validate token
    let authenticatedUser = null
    if (userId) {
      const authHeader = request.headers.get('authorization')
      const token = AuthManager.extractTokenFromHeader(authHeader)
      
      if (!token) {
        return NextResponse.json({
          success: false,
          error: 'Authentication required'
        }, { status: 401 })
      }

      authenticatedUser = AuthManager.verifyToken(token)
      if (!authenticatedUser || authenticatedUser.userId !== userId) {
        return NextResponse.json({
          success: false,
          error: 'Invalid token or user mismatch'
        }, { status: 401 })
      }
    }

    try {
      let config: ExtensionConfig | null = null

      // Try to get user-specific config first
      if (userId) {
        try {
          config = await SupabaseHelper.getExtensionConfig(userId)
        } catch (error) {
          console.log('No user-specific config found, falling back to global')
        }
      }

      // Fall back to global config if no user-specific config
      if (!config) {
        try {
          config = await SupabaseHelper.getExtensionConfig() // No userId = global config
        } catch (error) {
          console.error('No global config found:', error)
        }
      }

      // If still no config, create default one
      if (!config) {
        const defaultConfig = {
          title: 'Server Controlled Extension',
          version: '1.0.0',
          theme: 'light' as const,
          layout: 'default',
          features: [
            {
              name: 'note_taking',
              title: 'Note Taking',
              type: 'editor' as const,
              premium: false,
              enabled: true,
              description: 'Take and save notes',
              placeholder: 'Enter your notes here...',
              buttonLabel: 'Save Note'
            }
          ],
          badge: {
            enabled: true,
            text: '',
            color: '#2196F3'
          },
          supabase: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
          }
        }

        // Save default config as global config
        try {
          config = await SupabaseHelper.createExtensionConfig(defaultConfig)
        } catch (error) {
          console.error('Failed to create default config:', error)
          return NextResponse.json(defaultConfig)
        }
      }

      // Filter features based on user subscription if authenticated
      if (authenticatedUser && config && config.features) {
        const userHasPremium = AuthManager.hasPremiumAccess(authenticatedUser)
        
        // Disable premium features for non-premium users
        config.features = config.features.map(feature => ({
          ...feature,
          enabled: feature.premium ? userHasPremium : feature.enabled
        }))
      }

      // Log config request
      if (userId && config) {
        await SupabaseHelper.log({
          level: 'info',
          message: 'Extension config requested',
          user_id: userId,
          metadata: {
            config_id: config.id,
            version: config.version
          }
        })
      }

      // Return config without sensitive information
      if (!config) {
        return NextResponse.json({
          success: false,
          error: 'No configuration found'
        }, { status: 404 })
      }

      const responseConfig = {
        ...config,
        supabase_config: config.supabase || {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      }

      return NextResponse.json(responseConfig)

    } catch (error: any) {
      console.error('Error fetching config:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch configuration'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Config API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const authHeader = request.headers.get('authorization')
    const token = AuthManager.extractTokenFromHeader(authHeader)
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const user = AuthManager.verifyToken(token)
    if (!user || !AuthManager.hasPermission(user, 'admin')) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, config } = body

    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'Config data is required'
      }, { status: 400 })
    }

    try {
      // Create or update extension config
      const savedConfig = await SupabaseHelper.createExtensionConfig({
        user_id: user_id || null,
        title: config.title || 'Extension',
        version: config.version || '1.0.0',
        theme: config.theme || 'light',
        layout: config.layout || 'default',
        features: config.features || [],
        badge: config.badge || { enabled: false },
        supabase: config.supabase || {}
      })

      // Log config creation
      await SupabaseHelper.log({
        level: 'info',
        message: user_id ? 'User-specific config created' : 'Global config created',
        user_id: user.userId,
        metadata: {
          config_id: savedConfig.id,
          target_user: user_id
        }
      })

      return NextResponse.json({
        success: true,
        data: savedConfig
      })

    } catch (error: any) {
      console.error('Error saving config:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to save configuration'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Config POST API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate admin user
    const authHeader = request.headers.get('authorization')
    const token = AuthManager.extractTokenFromHeader(authHeader)
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const user = AuthManager.verifyToken(token)
    if (!user || !AuthManager.hasPermission(user, 'admin')) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()
    const { config_id, updates } = body

    if (!config_id || !updates) {
      return NextResponse.json({
        success: false,
        error: 'Config ID and updates are required'
      }, { status: 400 })
    }

    try {
      const updatedConfig = await SupabaseHelper.updateExtensionConfig(config_id, updates)

      // Log config update
      await SupabaseHelper.log({
        level: 'info',
        message: 'Extension config updated',
        user_id: user.userId,
        metadata: {
          config_id: config_id,
          updates: Object.keys(updates)
        }
      })

      return NextResponse.json({
        success: true,
        data: updatedConfig
      })

    } catch (error: any) {
      console.error('Error updating config:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to update configuration'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Config PUT API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
