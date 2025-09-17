import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { feature, data } = await request.json()

    if (!feature || !data) {
      return NextResponse.json({ error: 'Feature and data are required' }, { status: 400 })
    }

    // Save data to Supabase using service role key
    const { data: result, error } = await supabase
      .from('user_data')
      .insert({
        user_id: authResult.user.id,
        feature,
        data,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: result 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
