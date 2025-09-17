import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Delete data from Supabase
    const { data: result, error } = await supabase
      .from('user_data')
      .delete()
      .eq('id', id)
      .eq('user_id', authResult.user.id) // Ensure user can only delete their own data
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 })
    }

    if (!result) {
      return NextResponse.json({ error: 'Data not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Data deleted successfully' 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
