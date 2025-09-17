import { NextRequest, NextResponse } from 'next/server'
import { SupabaseHelper } from '@/lib/supabase'
import { AuthManager } from '@/lib/auth'
import { DashboardStats } from '@/types'

export async function GET(request: NextRequest) {
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

    try {
      // Get dashboard statistics
      const stats = await SupabaseHelper.getDashboardStats()
      
      // Get additional analytics
      const { supabaseAdmin, TABLES } = await import('@/lib/supabase')
      
      // Get recent activity logs
      const { data: recentLogs } = await supabaseAdmin
        .from(TABLES.LOGS)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10)

      // Get popular features usage
      const { data: featureUsage } = await supabaseAdmin
        .from(TABLES.USER_DATA)
        .select('feature')
        .limit(1000)

      // Calculate feature usage statistics
      const featureStats = featureUsage?.reduce((acc: Record<string, number>, item) => {
        acc[item.feature] = (acc[item.feature] || 0) + 1
        return acc
      }, {}) || {}

      const popularFeatures = Object.entries(featureStats)
        .map(([name, usage]) => ({ name, usage: usage as number }))
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 5)

      // Get subscription breakdown
      const { data: subscriptionData } = await supabaseAdmin
        .from(TABLES.USERS)
        .select('subscription')

      const subscriptionStats = subscriptionData?.reduce((acc: Record<string, number>, item) => {
        acc[item.subscription] = (acc[item.subscription] || 0) + 1
        return acc
      }, {}) || {}

      // Calculate growth metrics (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { count: newUsersCount } = await supabaseAdmin
        .from(TABLES.USERS)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())

      // Calculate daily active users (users with activity in last 24 hours)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const { data: activeUsersData } = await supabaseAdmin
        .from(TABLES.USER_DATA)
        .select('user_id')
        .gte('created_at', yesterday.toISOString())

      const dailyActiveUsers = new Set(activeUsersData?.map(item => item.user_id) || []).size

      // Calculate weekly active users (users with activity in last 7 days)
      const lastWeek = new Date()
      lastWeek.setDate(lastWeek.getDate() - 7)

      const { data: weeklyActiveUsersData } = await supabaseAdmin
        .from(TABLES.USER_DATA)
        .select('user_id')
        .gte('created_at', lastWeek.toISOString())

      const weeklyActiveUsers = new Set(weeklyActiveUsersData?.map(item => item.user_id) || []).size

      const dashboardStats: DashboardStats = {
        ...stats,
        usageStats: {
          dailyActiveUsers,
          weeklyActiveUsers,
          monthlyActiveUsers: newUsersCount || 0,
          featureUsage: featureStats,
          popularFeatures
        }
      }

      const response = {
        success: true,
        data: {
          stats: dashboardStats,
          recentLogs: recentLogs || [],
          subscriptionStats,
          growth: {
            newUsersLast30Days: newUsersCount || 0,
            dailyActiveUsers,
            weeklyActiveUsers
          }
        }
      }

      return NextResponse.json(response)

    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch dashboard statistics'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Dashboard API error:', error)
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
