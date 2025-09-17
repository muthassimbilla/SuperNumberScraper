'use client'

import { useState, useEffect } from 'react'
import {
  CogIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  GiftIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface Subscription {
  id: string
  user_id: string
  user_email: string
  type: 'free' | 'premium'
  status: 'active' | 'expired' | 'cancelled' | 'pending'
  starts_at: string
  expires_at?: string
  payment_id?: string
  created_at: string
}

interface SubscriptionPlan {
  id: string
  name: string
  type: 'free' | 'premium'
  price: number
  duration_days: number
  features: string[]
  is_active: boolean
}

export default function SubscriptionManagerPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'plans'>('overview')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreatePlan, setShowCreatePlan] = useState(false)
  const [showAddSubscription, setShowAddSubscription] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // For demo purposes, using mock data
      setSubscriptions([
        {
          id: '1',
          user_id: '1',
          user_email: 'john@example.com',
          type: 'premium',
          status: 'active',
          starts_at: '2025-01-01T00:00:00Z',
          expires_at: '2025-12-31T23:59:59Z',
          payment_id: 'pay_123456',
          created_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          user_id: '2',
          user_email: 'jane@example.com',
          type: 'free',
          status: 'active',
          starts_at: '2025-02-01T00:00:00Z',
          created_at: '2025-02-01T00:00:00Z'
        },
        {
          id: '3',
          user_id: '4',
          user_email: 'expired@example.com',
          type: 'premium',
          status: 'expired',
          starts_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-12-31T23:59:59Z',
          payment_id: 'pay_789012',
          created_at: '2024-01-01T00:00:00Z'
        }
      ])

      setPlans([
        {
          id: '1',
          name: 'Free Plan',
          type: 'free',
          price: 0,
          duration_days: 0, // Unlimited
          features: ['Basic Features', '5 Notes', 'Data Sync'],
          is_active: true
        },
        {
          id: '2',
          name: 'Premium Monthly',
          type: 'premium',
          price: 9.99,
          duration_days: 30,
          features: ['All Features', 'Unlimited Notes', 'PDF Export', 'Priority Support', 'Custom Themes'],
          is_active: true
        },
        {
          id: '3',
          name: 'Premium Yearly',
          type: 'premium',
          price: 99.99,
          duration_days: 365,
          features: ['All Features', 'Unlimited Notes', 'PDF Export', 'Priority Support', 'Custom Themes', '2 Months Free'],
          is_active: true
        }
      ])
    } catch (error) {
      toast.error('Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSubscription = async (subscriptionId: string, updates: Partial<Subscription>) => {
    try {
      // API call would go here
      setSubscriptions(prev => prev.map(sub => 
        sub.id === subscriptionId ? { ...sub, ...updates } : sub
      ))
      toast.success('Subscription updated successfully')
    } catch (error) {
      toast.error('Failed to update subscription')
    }
  }

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return
    
    try {
      await handleUpdateSubscription(subscriptionId, { status: 'cancelled' })
    } catch (error) {
      toast.error('Failed to cancel subscription')
    }
  }

  const handleExtendSubscription = async (subscriptionId: string, days: number) => {
    try {
      const subscription = subscriptions.find(s => s.id === subscriptionId)
      if (!subscription) return

      const currentExpiry = subscription.expires_at ? new Date(subscription.expires_at) : new Date()
      const newExpiry = new Date(currentExpiry.getTime() + (days * 24 * 60 * 60 * 1000))
      
      await handleUpdateSubscription(subscriptionId, { 
        expires_at: newExpiry.toISOString(),
        status: 'active'
      })
      toast.success(`Subscription extended by ${days} days`)
    } catch (error) {
      toast.error('Failed to extend subscription')
    }
  }

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || sub.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // Calculate stats
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    premium: subscriptions.filter(s => s.type === 'premium' && s.status === 'active').length,
    expired: subscriptions.filter(s => s.status === 'expired').length,
    revenue: subscriptions
      .filter(s => s.type === 'premium' && s.status === 'active')
      .reduce((sum, s) => {
        const plan = plans.find(p => p.type === 'premium')
        return sum + (plan?.price || 0)
      }, 0)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64 pulse-loading"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card pulse-loading h-24"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Manager</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage user subscriptions and plans
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreatePlan(true)}
            className="btn-secondary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Plan
          </button>
          <button
            onClick={() => setShowAddSubscription(true)}
            className="btn-primary"
          >
            <CreditCardIcon className="h-5 w-5 mr-2" />
            Add Subscription
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: CogIcon },
            { id: 'subscriptions', name: 'Subscriptions', icon: CreditCardIcon },
            { id: 'plans', name: 'Plans', icon: GiftIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <CreditCardIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Premium Users</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.premium}</p>
                </div>
                <GiftIcon className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">${stats.revenue.toFixed(2)}</p>
                </div>
                <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Subscriptions</h3>
              <div className="space-y-3">
                {subscriptions.slice(0, 5).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900">{sub.user_email}</p>
                      <p className="text-sm text-gray-500">
                        {sub.type} • {sub.status}
                      </p>
                    </div>
                    <span className={`badge ${
                      sub.status === 'active' ? 'badge-success' :
                      sub.status === 'expired' ? 'badge-error' :
                      sub.status === 'cancelled' ? 'badge-secondary' :
                      'badge-warning'
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h3>
              <div className="space-y-4">
                {plans.map((plan) => {
                  const count = subscriptions.filter(s => 
                    s.type === plan.type && s.status === 'active'
                  ).length
                  const percentage = stats.active > 0 ? (count / stats.active) * 100 : 0
                  
                  return (
                    <div key={plan.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{plan.name}</span>
                        <span className="text-sm text-gray-500">{count} users</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-input"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Started</th>
                    <th>Expires</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((subscription) => (
                    <tr key={subscription.id}>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900">{subscription.user_email}</p>
                          <p className="text-sm text-gray-500">ID: {subscription.user_id}</p>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          subscription.type === 'premium' ? 'badge-warning' : 'badge-secondary'
                        }`}>
                          {subscription.type}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          subscription.status === 'active' ? 'badge-success' :
                          subscription.status === 'expired' ? 'badge-error' :
                          subscription.status === 'cancelled' ? 'badge-secondary' :
                          'badge-warning'
                        }`}>
                          {subscription.status}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-gray-600">
                          {new Date(subscription.starts_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        {subscription.expires_at ? (
                          <div>
                            <span className="text-sm text-gray-600">
                              {new Date(subscription.expires_at).toLocaleDateString()}
                            </span>
                            {new Date(subscription.expires_at) < new Date() && (
                              <p className="text-xs text-red-600">Expired</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Never</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          {subscription.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleExtendSubscription(subscription.id, 30)}
                                className="text-green-600 hover:text-green-700"
                                title="Extend 30 days"
                              >
                                <CalendarDaysIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleCancelSubscription(subscription.id)}
                                className="text-red-600 hover:text-red-700"
                                title="Cancel subscription"
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {subscription.status === 'expired' && (
                            <button
                              onClick={() => handleUpdateSubscription(subscription.id, { status: 'active', expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })}
                              className="text-green-600 hover:text-green-700"
                              title="Reactivate"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <span className={`badge ${
                    plan.type === 'premium' ? 'badge-warning' : 'badge-secondary'
                  }`}>
                    {plan.type}
                  </span>
                </div>
                
                <div className="mb-4">
                  <div className="text-3xl font-bold text-gray-900">
                    ${plan.price}
                    {plan.duration_days > 0 && (
                      <span className="text-lg font-normal text-gray-500">
                        /{plan.duration_days === 30 ? 'month' : 'year'}
                      </span>
                    )}
                  </div>
                  {plan.duration_days === 0 && (
                    <p className="text-sm text-gray-500">Forever free</p>
                  )}
                </div>
                
                <div className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  <button className="flex-1 btn-secondary text-sm">
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  {plan.type !== 'free' && (
                    <button className="text-red-600 hover:text-red-700">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals would go here */}
      {showCreatePlan && (
        <CreatePlanModal onClose={() => setShowCreatePlan(false)} />
      )}
      
      {showAddSubscription && (
        <AddSubscriptionModal onClose={() => setShowAddSubscription(false)} />
      )}
    </div>
  )
}

// Modal Components
function CreatePlanModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Plan</h3>
        <p className="text-gray-600 mb-4">Plan creation feature coming soon...</p>
        <button onClick={onClose} className="btn-secondary w-full">
          Close
        </button>
      </div>
    </div>
  )
}

function AddSubscriptionModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Subscription</h3>
        <p className="text-gray-600 mb-4">Subscription creation feature coming soon...</p>
        <button onClick={onClose} className="btn-secondary w-full">
          Close
        </button>
      </div>
    </div>
  )
}
