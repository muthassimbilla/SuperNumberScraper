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

    const { feature, action, input } = await request.json()

    if (!feature || !action) {
      return NextResponse.json({ error: 'Feature and action are required' }, { status: 400 })
    }

    // Get user subscription status
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', authResult.user.id)
      .single()

    const userSubscription = subscription?.status || 'free'

    // Check if feature requires premium access
    const { data: featureData } = await supabase
      .from('features')
      .select('premium, enabled')
      .eq('name', feature)
      .single()

    if (!featureData) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    if (!featureData.enabled) {
      return NextResponse.json({ error: 'Feature is disabled' }, { status: 403 })
    }

    if (featureData.premium && userSubscription !== 'premium') {
      return NextResponse.json({ 
        error: 'Premium subscription required for this feature',
        requiresPremium: true 
      }, { status: 403 })
    }

    // Execute feature based on type
    let result
    switch (feature) {
      case 'note_taking':
        result = await handleNoteTaking(action, input, authResult.user.id)
        break
      case 'pdf_export':
        result = await handlePdfExport(action, input, authResult.user.id)
        break
      case 'phone_scraper':
        result = await handlePhoneScraper(action, input, authResult.user.id)
        break
      default:
        result = await handleGenericFeature(feature, action, input, authResult.user.id)
    }

    // Log feature usage
    await supabase
      .from('user_data')
      .insert({
        user_id: authResult.user.id,
        feature: `${feature}_usage`,
        data: {
          action,
          timestamp: new Date().toISOString(),
          input_length: input ? input.length : 0
        }
      })

    return NextResponse.json({ 
      success: true, 
      data: result 
    })

  } catch (error) {
    console.error('Feature execution error:', error)
    return NextResponse.json({ error: 'Feature execution failed' }, { status: 500 })
  }
}

// Feature handlers
async function handleNoteTaking(action: string, input: string, userId: string) {
  switch (action) {
    case 'save':
      // Save note to database
      const { data, error } = await supabase
        .from('user_data')
        .insert({
          user_id,
          feature: 'notes',
          data: {
            content: input,
            created_at: new Date().toISOString(),
            type: 'note'
          }
        })
        .select()
        .single()

      if (error) throw error

      return {
        type: 'success',
        message: 'Note saved successfully',
        output: `Note saved: "${input.substring(0, 50)}${input.length > 50 ? '...' : ''}"`
      }

    case 'list':
      // Get user's notes
      const { data: notes } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', userId)
        .eq('feature', 'notes')
        .order('created_at', { ascending: false })
        .limit(10)

      return {
        type: 'display',
        output: notes?.map(note => 
          `<div class="note-item">
            <p>${note.data.content}</p>
            <small>${new Date(note.data.created_at).toLocaleDateString()}</small>
          </div>`
        ).join('') || 'No notes found'
      }

    default:
      throw new Error('Unknown action for note taking')
  }
}

async function handlePdfExport(action: string, input: string, userId: string) {
  // This would integrate with a PDF generation service
  return {
    type: 'download',
    message: 'PDF export feature - coming soon',
    output: 'PDF export functionality will be available soon!'
  }
}

async function handlePhoneScraper(action: string, input: string, userId: string) {
  // Phone number processing logic
  const phoneNumbers = input.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || []
  
  const processedNumbers = phoneNumbers.map(number => {
    const normalized = number.replace(/\D/g, '')
    const areaCode = normalized.substring(0, 3)
    
    return {
      original: number,
      normalized,
      areaCode,
      location: getLocationFromAreaCode(normalized)
    }
  })

  // Save processed numbers
  if (processedNumbers.length > 0) {
    await supabase
      .from('user_data')
      .insert({
        user_id,
        feature: 'phone_numbers',
        data: {
          numbers: processedNumbers,
          count: processedNumbers.length,
          created_at: new Date().toISOString()
        }
      })
  }

  return {
    type: 'display',
    output: `
      <div class="phone-results">
        <h4>Found ${processedNumbers.length} phone numbers:</h4>
        ${processedNumbers.map(num => 
          `<div class="phone-item">
            <strong>${num.original}</strong> - ${num.location}
          </div>`
        ).join('')}
      </div>
    `
  }
}

async function handleGenericFeature(feature: string, action: string, input: string, userId: string) {
  // Generic feature handler
  return {
    type: 'display',
    output: `Feature "${feature}" executed with action "${action}"`
  }
}

// Helper function for phone number location
function getLocationFromAreaCode(phoneNumber: string): string {
  const areaCodes: { [key: string]: string } = {
    '212': 'New York, NY',
    '213': 'Los Angeles, CA',
    '312': 'Chicago, IL',
    '415': 'San Francisco, CA',
    '305': 'Miami, FL',
    '404': 'Atlanta, GA',
    '617': 'Boston, MA',
    '202': 'Washington, DC',
    '214': 'Dallas, TX',
    '713': 'Houston, TX'
  }
  
  const areaCode = phoneNumber.substring(0, 3)
  return areaCodes[areaCode] || 'Unknown Location'
}
