'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  PlayIcon, 
  CogIcon, 
  UsersIcon, 
  ChartBarIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/outline'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeExtensions: 0,
    totalFeatures: 0,
    serverStatus: 'checking'
  })

  useEffect(() => {
    // Simulate loading and fetch initial stats
    const fetchStats = async () => {
      try {
        // This would be real API calls in production
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setStats({
          totalUsers: 127,
          activeExtensions: 95,
          totalFeatures: 12,
          serverStatus: 'online'
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
        setStats(prev => ({ ...prev, serverStatus: 'offline' }))
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const features = [
    {
      title: 'Extension Management',
      description: 'Control and configure Chrome extensions remotely',
      icon: PuzzlePieceIcon,
      href: '/dashboard/extensions',
      color: 'bg-blue-500'
    },
    {
      title: 'User Management',
      description: 'Manage users, subscriptions, and permissions',
      icon: UsersIcon,
      href: '/dashboard/users',
      color: 'bg-green-500'
    },
    {
      title: 'Feature Control',
      description: 'Enable/disable features and manage premium content',
      icon: CogIcon,
      href: '/dashboard/features',
      color: 'bg-purple-500'
    },
    {
      title: 'Analytics',
      description: 'View usage statistics and performance metrics',
      icon: ChartBarIcon,
      href: '/dashboard/analytics',
      color: 'bg-yellow-500'
    },
    {
      title: 'Security',
      description: 'Monitor security events and access controls',
      icon: ShieldCheckIcon,
      href: '/dashboard/security',
      color: 'bg-red-500'
    },
    {
      title: 'Documentation',
      description: 'API documentation and integration guides',
      icon: DocumentTextIcon,
      href: '/docs',
      color: 'bg-indigo-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <PuzzlePieceIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Server Controlled Extension
                </h1>
                <p className="text-sm text-gray-500">Control Panel</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${
                  stats.serverStatus === 'online' ? 'bg-green-500' : 
                  stats.serverStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-sm text-gray-600 capitalize">
                  {stats.serverStatus}
                </span>
              </div>
              
              <Link href="/auth/login" className="btn-primary">
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
              Server Controlled
              <span className="text-blue-600"> Extension</span>
            </h2>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              Manage Chrome extensions remotely with dynamic UI, features, and user controls. 
              Everything is controlled from your server - no extension updates needed.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard" className="btn-primary text-lg px-8 py-3">
                <PlayIcon className="h-5 w-5 mr-2" />
                Get Started
              </Link>
              <Link href="/docs" className="btn-secondary text-lg px-8 py-3">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                View Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Users', value: stats.totalUsers, suffix: '' },
              { label: 'Active Extensions', value: stats.activeExtensions, suffix: '' },
              { label: 'Features', value: stats.totalFeatures, suffix: '' },
              { label: 'Uptime', value: '99.9', suffix: '%' }
            ].map((stat, index) => (
              <div key={index} className="text-center p-6">
                <div className="text-3xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="spinner mx-auto"></div>
                  ) : (
                    <>
                      {stat.value}
                      <span className="text-blue-600">{stat.suffix}</span>
                    </>
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900">
              Powerful Features
            </h3>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to manage your Chrome extensions at scale
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Link 
                key={index}
                href={feature.href}
                className="feature-card group"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-lg ${feature.color}`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h4>
                </div>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900">
              How It Works
            </h3>
            <p className="mt-4 text-lg text-gray-600">
              Simple, powerful, and completely server-controlled
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Install Extension',
                description: 'Users install the lightweight Chrome extension shell'
              },
              {
                step: '2',
                title: 'Server Control',
                description: 'All UI, features, and content are served from your website'
              },
              {
                step: '3',
                title: 'Real-time Updates',
                description: 'Changes are reflected instantly without extension updates'
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h4>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <PuzzlePieceIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">Server Controlled Extension</span>
              </div>
              <p className="text-gray-400 mb-4">
                The ultimate solution for managing Chrome extensions remotely with 
                server-side control and real-time updates.
              </p>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Links</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-white">API</Link></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/status" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Server Controlled Extension. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
