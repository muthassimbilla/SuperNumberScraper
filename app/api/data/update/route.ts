import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, data } = await request.json()

    if (!id || !data) {
      return NextResponse.json({ error: 'ID and data are required' }, { status: 400 })
    }

    // Update data in Supabase
    const { data: result, error } = await supabase
      .from('user_data')
      .update({
        data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', authResult.user.id) // Ensure user can only update their own data
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update data' }, { status: 500 })
    }

    if (!result) {
      return NextResponse.json({ error: 'Data not found or access denied' }, { status: 404 })
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
