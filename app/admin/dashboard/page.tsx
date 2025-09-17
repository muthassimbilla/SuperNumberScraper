'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  UsersIcon,
  PuzzlePieceIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  premiumUsers: number
  totalFeatures: number
  activeExtensions: number
  serverStatus: 'online' | 'offline' | 'maintenance'
  usageStats: {
    dailyActiveUsers: number
    weeklyActiveUsers: number
    monthlyActiveUsers: number
    featureUsage: Record<string, number>
    popularFeatures: Array<{ name: string; usage: number }>
  }
}

interface LogEntry {
  id: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  timestamp: string
  user_id?: string
  feature?: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true)
      const token = localStorage.getItem('admin_token')
      
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const data = await response.json()
      if (data.success) {
        setStats(data.data.stats)
        setRecentLogs(data.data.recentLogs || [])
      } else {
        throw new Error(data.error || 'Failed to fetch data')
      }
    } catch (error: any) {
      console.error('Dashboard error:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card pulse-loading">
              <div className="h-20"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card pulse-loading h-64"></div>
          <div className="card pulse-loading h-64"></div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      change: '+12%',
      changeType: 'increase',
      icon: UsersIcon,
      color: 'blue',
      href: '/admin/users'
    },
    {
      title: 'Active Extensions',
      value: stats?.activeExtensions || 0,
      change: '+8%',
      changeType: 'increase',
      icon: PuzzlePieceIcon,
      color: 'green',
      href: '/admin/features'
    },
    {
      title: 'Premium Users',
      value: stats?.premiumUsers || 0,
      change: '+23%',
      changeType: 'increase',
      icon: CurrencyDollarIcon,
      color: 'yellow',
      href: '/admin/users?filter=premium'
    },
    {
      title: 'Daily Active',
      value: stats?.usageStats?.dailyActiveUsers || 0,
      change: '-2%',
      changeType: 'decrease',
      icon: ChartBarIcon,
      color: 'purple',
      href: '/admin/analytics'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            stats?.serverStatus === 'online' ? 'bg-green-100 text-green-800' :
            stats?.serverStatus === 'offline' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              stats?.serverStatus === 'online' ? 'bg-green-500' :
              stats?.serverStatus === 'offline' ? 'bg-red-500' :
              'bg-yellow-500'
            }`}></div>
            <span className="capitalize">{stats?.serverStatus || 'Unknown'}</span>
          </div>
          {refreshing && (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="spinner"></div>
              <span className="text-sm">Refreshing...</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="btn-secondary"
          >
            🔄 Refresh
          </button>
          <Link href="/admin/settings" className="btn-primary">
            ⚙️ Settings
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Link key={index} href={stat.href} className="block">
            <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    {stat.changeType === 'increase' ? (
                      <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${
                  stat.color === 'blue' ? 'bg-blue-100' :
                  stat.color === 'green' ? 'bg-green-100' :
                  stat.color === 'yellow' ? 'bg-yellow-100' :
                  'bg-purple-100'
                }`}>
                  <stat.icon className={`h-6 w-6 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'yellow' ? 'text-yellow-600' :
                    'text-purple-600'
                  }`} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular Features */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Popular Features</h3>
              <Link href="/admin/features" className="text-blue-600 hover:text-blue-700 text-sm">
                View all →
              </Link>
            </div>
            
            <div className="space-y-4">
              {stats?.usageStats?.popularFeatures?.slice(0, 5).map((feature, index) => (
                <div key={feature.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {feature.name.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {feature.usage} uses
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ 
                          width: `${Math.min(100, (feature.usage / (stats?.usageStats?.popularFeatures?.[0]?.usage || 1)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {Math.round((feature.usage / (stats?.usageStats?.popularFeatures?.[0]?.usage || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No feature usage data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Weekly Active</span>
                <span className="font-medium">{stats?.usageStats?.weeklyActiveUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Active</span>
                <span className="font-medium">{stats?.usageStats?.monthlyActiveUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Features</span>
                <span className="font-medium">{stats?.totalFeatures || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Conversion Rate</span>
                <span className="font-medium text-green-600">
                  {stats?.totalUsers && stats?.premiumUsers 
                    ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) 
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/admin/users/new" className="block w-full btn-primary text-center">
                + Add User
              </Link>
              <Link href="/admin/features/new" className="block w-full btn-secondary text-center">
                + Add Feature
              </Link>
              <Link href="/admin/settings/config" className="block w-full btn-secondary text-center">
                ⚙️ Update Config
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <Link href="/admin/logs" className="text-blue-600 hover:text-blue-700 text-sm">
            View all logs →
          </Link>
        </div>
        
        <div className="space-y-3">
          {recentLogs.length > 0 ? recentLogs.slice(0, 8).map((log) => (
            <div key={log.id} className="flex items-start space-x-3 py-2">
              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                log.level === 'error' ? 'bg-red-500' :
                log.level === 'warn' ? 'bg-yellow-500' :
                log.level === 'info' ? 'bg-blue-500' :
                'bg-gray-500'
              }`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{log.message}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    log.level === 'error' ? 'bg-red-100 text-red-800' :
                    log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                    log.level === 'info' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  {log.feature && (
                    <span className="text-xs text-gray-500">
                      • {log.feature}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">
              <ClockIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
