import { NextRequest, NextResponse } from 'next/server'
import { SupabaseHelper } from '@/lib/supabase'
import { AuthManager } from '@/lib/auth'
import { FeatureExecutionRequest, FeatureExecutionResult } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization')
    const token = AuthManager.extractTokenFromHeader(authHeader)
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const user = AuthManager.verifyToken(token)
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token'
      }, { status: 401 })
    }

    const body: FeatureExecutionRequest = await request.json()
    const { user_id, feature, action = 'execute', input } = body

    // Validate user_id matches token
    if (user_id !== user.userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID mismatch'
      }, { status: 403 })
    }

    if (!feature) {
      return NextResponse.json({
        success: false,
        error: 'Feature name is required'
      }, { status: 400 })
    }

    try {
      // Get feature configuration
      const features = await SupabaseHelper.getFeatures()
      const featureConfig = features?.find(f => f.name === feature)

      if (!featureConfig || !featureConfig.is_active) {
        return NextResponse.json({
          success: false,
          error: 'Feature not found or inactive'
        }, { status: 404 })
      }

      // Check if feature is enabled
      if (!featureConfig.enabled) {
        return NextResponse.json({
          success: false,
          error: 'Feature is disabled'
        }, { status: 403 })
      }

      // Check premium access for premium features
      if (featureConfig.premium && !AuthManager.hasPremiumAccess(user)) {
        return NextResponse.json({
          success: false,
          error: 'Premium subscription required for this feature'
        }, { status: 403 })
      }

      // Execute the feature
      const result = await executeFeature(feature, action, input, user)

      // Log feature usage
      await SupabaseHelper.log({
        level: 'info',
        message: `Feature executed: ${feature}`,
        user_id: user.userId,
        feature: feature,
        metadata: {
          action,
          success: result.success,
          input_length: input ? (typeof input === 'string' ? input.length : JSON.stringify(input).length) : 0
        }
      })

      return NextResponse.json({
        success: true,
        data: result
      })

    } catch (error: any) {
      console.error('Feature execution error:', error)
      
      // Log error
      await SupabaseHelper.log({
        level: 'error',
        message: `Feature execution failed: ${feature}`,
        user_id: user.userId,
        feature: feature,
        metadata: {
          action,
          error: error.message
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Feature execution failed'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Run feature API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Feature execution logic
async function executeFeature(
  feature: string, 
  action: string, 
  input: any, 
  user: any
): Promise<FeatureExecutionResult> {
  
  switch (feature) {
    case 'note_taking':
      return await executeNoteTaking(action, input, user)
    
    case 'pdf_export':
      return await executePdfExport(action, input, user)
    
    case 'data_sync':
      return await executeDataSync(action, input, user)
    
    case 'custom_themes':
      return await executeCustomThemes(action, input, user)
    
    case 'analytics':
      return await executeAnalytics(action, input, user)
    
    default:
      return {
        success: false,
        error: `Unknown feature: ${feature}`
      }
  }
}

// Individual feature implementations
async function executeNoteTaking(action: string, input: any, user: any): Promise<FeatureExecutionResult> {
  try {
    switch (action) {
      case 'process':
      case 'save':
        if (!input || typeof input !== 'string') {
          return { success: false, error: 'Note content is required' }
        }

        // Save note to database
        await SupabaseHelper.saveUserData(user.userId, 'note_taking', {
          content: input,
          timestamp: new Date().toISOString()
        })

        return {
          success: true,
          output: 'Note saved successfully!',
          type: 'text'
        }

      case 'load':
        // Load user's notes
        const notes = await SupabaseHelper.getUserData(user.userId, 'note_taking')
        return {
          success: true,
          output: JSON.stringify(notes),
          type: 'text'
        }

      default:
        return { success: false, error: 'Unknown action for note taking' }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function executePdfExport(action: string, input: any, user: any): Promise<FeatureExecutionResult> {
  try {
    if (!input || typeof input !== 'string') {
      return { success: false, error: 'Content to export is required' }
    }

    // In a real implementation, you would generate a PDF here
    // For demo purposes, we'll simulate it
    const fileName = `export_${Date.now()}.pdf`
    const downloadUrl = `/api/download/${fileName}` // This would be a real URL to generated PDF

    // Log the export request
    await SupabaseHelper.saveUserData(user.userId, 'pdf_export', {
      content: input,
      fileName: fileName,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      output: 'PDF generated successfully!',
      type: 'download',
      url: downloadUrl,
      filename: fileName
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function executeDataSync(action: string, input: any, user: any): Promise<FeatureExecutionResult> {
  try {
    switch (action) {
      case 'sync':
        // Get all user data for syncing
        const userData = await SupabaseHelper.getUserData(user.userId)
        
        return {
          success: true,
          output: `Synced ${userData?.length || 0} records`,
          type: 'text'
        }

      case 'backup':
        // Create backup of user data
        const backupData = await SupabaseHelper.getUserData(user.userId)
        const backupName = `backup_${Date.now()}.json`
        
        // In real implementation, you'd save this to cloud storage
        await SupabaseHelper.saveUserData(user.userId, 'data_backup', {
          backup: backupData,
          timestamp: new Date().toISOString()
        })

        return {
          success: true,
          output: `Backup created: ${backupName}`,
          type: 'text'
        }

      default:
        return { success: false, error: 'Unknown action for data sync' }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function executeCustomThemes(action: string, input: any, user: any): Promise<FeatureExecutionResult> {
  try {
    switch (action) {
      case 'apply':
        if (!input || !input.theme) {
          return { success: false, error: 'Theme data is required' }
        }

        // Save user's theme preference
        await SupabaseHelper.saveUserData(user.userId, 'custom_theme', {
          theme: input.theme,
          timestamp: new Date().toISOString()
        })

        return {
          success: true,
          output: 'Theme applied successfully!',
          type: 'text'
        }

      case 'get':
        // Get user's current theme
        const themeData = await SupabaseHelper.getUserData(user.userId, 'custom_theme')
        const currentTheme = themeData?.[0]?.data?.theme || 'light'

        return {
          success: true,
          output: JSON.stringify({ theme: currentTheme }),
          type: 'text'
        }

      default:
        return { success: false, error: 'Unknown action for custom themes' }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function executeAnalytics(action: string, input: any, user: any): Promise<FeatureExecutionResult> {
  try {
    // Get user's activity data
    const userData = await SupabaseHelper.getUserData(user.userId)
    
    // Calculate some basic analytics
    const totalActions = userData?.length || 0
    const features = Array.from(new Set(userData?.map(d => d.feature) || []))
    const lastActivity = userData?.[0]?.created_at || 'Never'

    const analyticsHTML = `
      <div style="font-family: Arial, sans-serif; padding: 16px;">
        <h3 style="margin: 0 0 16px 0; color: #333;">Your Analytics</h3>
        <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
          <strong>Total Actions:</strong> ${totalActions}
        </div>
        <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
          <strong>Features Used:</strong> ${features.join(', ') || 'None'}
        </div>
        <div style="background: #f5f5f5; padding: 12px; border-radius: 8px;">
          <strong>Last Activity:</strong> ${new Date(lastActivity).toLocaleDateString()}
        </div>
      </div>
    `

    return {
      success: true,
      output: analyticsHTML,
      type: 'html'
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
