import { NextRequest, NextResponse } from 'next/server'
import { SupabaseHelper, supabaseAuth } from '@/lib/supabase'
import { AuthManager, loginRateLimiter } from '@/lib/auth'
import { RegisterRequest, RegisterResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()
    const { email, password, name } = body

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json({
        success: false,
        error: 'Email, password, and name are required'
      }, { status: 400 })
    }

    if (!AuthManager.isValidEmail(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 6 characters'
      }, { status: 400 })
    }

    // Check rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const identifier = `${clientIP}-${email}`

    if (loginRateLimiter.isBlocked(identifier)) {
      return NextResponse.json({
        success: false,
        error: 'Too many registration attempts. Please try again later.'
      }, { status: 429 })
    }

    try {
      // Check if Supabase is configured
      const { isSupabaseConfigured } = await import('@/lib/supabase')
      
      if (!isSupabaseConfigured()) {
        // Return mock success for build time
        return NextResponse.json({
          success: true,
          message: 'Registration successful (demo mode)',
          user: {
            id: 'demo-user-id',
            email: email,
            name: name,
            subscription: 'free',
            is_active: true
          }
        })
      }

      // Use Supabase Auth for registration
      const authResult = await supabaseAuth.signUp(email, password, {
        name: name,
        full_name: name
      })

      if (!authResult.success) {
        // Record failed attempt
        loginRateLimiter.recordAttempt(identifier)
        
        return NextResponse.json({
          success: false,
          error: authResult.error || 'Registration failed'
        }, { status: 400 })
      }

      // Create user profile in our users table
      if (authResult.user) {
        try {
          await SupabaseHelper.createUser({
            email: email,
            subscription: 'free',
            metadata: {
              name: name,
              full_name: name,
              registration_source: 'website'
            }
          })
        } catch (profileError) {
          console.error('Profile creation error:', profileError)
          // Continue with registration even if profile creation fails
        }
      }

      // Reset rate limiting on successful registration
      loginRateLimiter.reset(identifier)

      // Log successful registration
      if (authResult.user) {
        await SupabaseHelper.log({
          level: 'info',
          message: 'User registered successfully',
          user_id: authResult.user.id,
          metadata: {
            ip: clientIP,
            user_agent: request.headers.get('user-agent'),
            name: name
          }
        })
      }

      const response: RegisterResponse = {
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        user: authResult.user && authResult.user.email ? {
          id: authResult.user.id,
          email: authResult.user.email,
          name: name,
          subscription: 'free',
          is_active: false, // Will be true after email verification
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } : undefined
      }

      return NextResponse.json(response)

    } catch (authError: any) {
      // Record failed attempt
      loginRateLimiter.recordAttempt(identifier)
      
      console.error('Registration error:', authError)
      return NextResponse.json({
        success: false,
        error: 'Registration failed. Please try again.'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Register API error:', error)
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
