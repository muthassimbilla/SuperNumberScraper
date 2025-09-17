import { NextRequest, NextResponse } from 'next/server'
import { SupabaseHelper } from '@/lib/supabase'
import { AuthManager, loginRateLimiter } from '@/lib/auth'
import { LoginRequest, LoginResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 })
    }

    if (!AuthManager.isValidEmail(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 })
    }

    // Check rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const identifier = `${clientIP}-${email}`

    if (loginRateLimiter.isBlocked(identifier)) {
      return NextResponse.json({
        success: false,
        error: 'Too many login attempts. Please try again later.'
      }, { status: 429 })
    }

    try {
      // Use Supabase Auth for authentication
      const { supabaseAuth } = await import('@/lib/supabase')
      const authResult = await supabaseAuth.signIn(email, password)

      if (!authResult.success) {
        // Record failed attempt
        loginRateLimiter.recordAttempt(identifier)
        
        return NextResponse.json({
          success: false,
          error: authResult.error || 'Invalid credentials'
        }, { status: 401 })
      }

      // Get user profile from our users table
      const user = await SupabaseHelper.getUserById(authResult.user.id)
      
      if (!user) {
        return NextResponse.json({
          success: false,
          error: 'User profile not found'
        }, { status: 404 })
      }

      if (!user.is_active) {
        return NextResponse.json({
          success: false,
          error: 'Account is deactivated'
        }, { status: 403 })
      }

      // Generate our custom JWT token
      const token = AuthManager.generateToken(user)
      const refreshToken = AuthManager.generateRefreshToken(user)

      // Reset rate limiting on successful login
      loginRateLimiter.reset(identifier)

      // Log successful login
      await SupabaseHelper.log({
        level: 'info',
        message: 'User logged in successfully',
        user_id: user.id,
        metadata: {
          ip: clientIP,
          user_agent: request.headers.get('user-agent')
        }
      })

      const response: LoginResponse = {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          subscription: user.subscription,
          subscription_expires_at: user.subscription_expires_at,
          is_active: user.is_active,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        token,
        refreshToken
      }

      return NextResponse.json(response)

    } catch (authError: any) {
      // Record failed attempt
      loginRateLimiter.recordAttempt(identifier)
      
      console.error('Authentication error:', authError)
      return NextResponse.json({
        success: false,
        error: 'Authentication failed'
      }, { status: 401 })
    }

  } catch (error: any) {
    console.error('Login API error:', error)
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
