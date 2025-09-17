import { NextRequest, NextResponse } from 'next/server'
import { SupabaseHelper } from '@/lib/supabase'
import { AuthManager } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

    try {
      // Get full user profile
      const userProfile = await SupabaseHelper.getUserById(user.userId)
      
      if (!userProfile) {
        return NextResponse.json({
          success: false,
          error: 'User profile not found'
        }, { status: 404 })
      }

      // Get user's recent activity
      const recentActivity = await SupabaseHelper.getUserData(user.userId)
      const activityCount = recentActivity?.length || 0

      // Remove sensitive information
      const safeProfile = {
        id: userProfile.id,
        email: userProfile.email,
        subscription: userProfile.subscription,
        subscription_expires_at: userProfile.subscription_expires_at,
        is_active: userProfile.is_active,
        role: userProfile.role,
        metadata: userProfile.metadata,
        created_at: userProfile.created_at,
        updated_at: userProfile.updated_at,
        activity_count: activityCount
      }

      return NextResponse.json({
        success: true,
        data: safeProfile
      })

    } catch (error: any) {
      console.error('Error fetching user profile:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user profile'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('User profile API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { metadata } = body

    try {
      // Update user profile (only allow metadata updates for security)
      const { supabaseAdmin, TABLES } = await import('@/lib/supabase')
      
      const { data, error } = await supabaseAdmin
        .from(TABLES.USERS)
        .update({
          metadata: metadata || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', user.userId)
        .select()
        .single()

      if (error) throw error

      // Log profile update
      await SupabaseHelper.log({
        level: 'info',
        message: 'User profile updated',
        user_id: user.userId,
        metadata: {
          updated_fields: Object.keys(body)
        }
      })

      return NextResponse.json({
        success: true,
        data: data
      })

    } catch (error: any) {
      console.error('Error updating user profile:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to update user profile'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('User profile update API error:', error)
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
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
