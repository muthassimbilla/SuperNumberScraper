import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'
import { createGenericAPIResponse, sanitizeError } from '@/lib/api-security'

// Generic notes API - hides database type
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, type = 'note' } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Save note (database type hidden)
    const { data, error } = await supabase
      .from('user_data')
      .insert({
        user_id: authResult.user.id,
        feature: 'notes',
        data: {
          content,
          type,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      const sanitizedError = sanitizeError(error)
      return NextResponse.json({ 
        success: false, 
        error: sanitizedError 
      }, { status: 500 })
    }

    const response = createGenericAPIResponse({ 
      id: data.id, 
      message: 'Note saved successfully' 
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get notes (database type hidden)
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', authResult.user.id)
      .eq('feature', 'notes')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: data || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
