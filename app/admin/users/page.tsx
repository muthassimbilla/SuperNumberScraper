'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface User {
  id: string
  email: string
  subscription: 'free' | 'premium'
  subscription_expires_at?: string
  is_active: boolean
  role: 'user' | 'admin'
  created_at: string
  updated_at?: string
  activity_count?: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      if (data.success) {
        setUsers(data.data || [])
      } else {
        throw new Error(data.error || 'Failed to fetch users')
      }
    } catch (error: any) {
      console.error('Users fetch error:', error)
      toast.error('Failed to load users')
      // Mock data for demo
      setUsers([
        {
          id: '1',
          email: 'john@example.com',
          subscription: 'premium',
          subscription_expires_at: '2025-12-31T23:59:59Z',
          is_active: true,
          role: 'user',
          created_at: '2025-01-15T10:30:00Z',
          activity_count: 45
        },
        {
          id: '2',
          email: 'jane@example.com',
          subscription: 'free',
          is_active: true,
          role: 'user',
          created_at: '2025-02-01T14:20:00Z',
          activity_count: 12
        },
        {
          id: '3',
          email: 'admin@example.com',
          subscription: 'premium',
          is_active: true,
          role: 'admin',
          created_at: '2025-01-01T00:00:00Z',
          activity_count: 156
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      setUsers(users.filter(user => user.id !== userId))
      toast.success('User deleted successfully')
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  const handleToggleUser = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update user status')
      }

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_active: !currentStatus }
          : user
      ))
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      toast.error('Failed to update user status')
    }
  }

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.length === 0) return

    const confirmMessage = `Are you sure you want to ${action} ${selectedUsers.length} user(s)?`
    if (!confirm(confirmMessage)) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          userIds: selectedUsers
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} users`)
      }

      // Update local state based on action
      if (action === 'delete') {
        setUsers(users.filter(user => !selectedUsers.includes(user.id)))
      } else {
        setUsers(users.map(user => 
          selectedUsers.includes(user.id)
            ? { ...user, is_active: action === 'activate' }
            : user
        ))
      }

      setSelectedUsers([])
      setShowBulkActions(false)
      toast.success(`${action} completed for ${selectedUsers.length} user(s)`)
    } catch (error) {
      toast.error(`Failed to ${action} users`)
    }
  }

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = 
        filterType === 'all' || 
        filterType === user.subscription ||
        (filterType === 'active' && user.is_active) ||
        (filterType === 'inactive' && !user.is_active) ||
        (filterType === 'admin' && user.role === 'admin')
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy as keyof User]
      let bValue: any = b[sortBy as keyof User]
      
      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id))
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 pulse-loading"></div>
          <div className="h-10 bg-gray-200 rounded w-32 pulse-loading"></div>
        </div>
        <div className="card">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded pulse-loading"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage {users.length} registered users
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/admin/users/new" className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add User
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="form-input"
              >
                <option value="all">All Users</option>
                <option value="free">Free Users</option>
                <option value="premium">Premium Users</option>
                <option value="admin">Admins</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field)
                setSortOrder(order as 'asc' | 'desc')
              }}
              className="form-input"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="email-asc">Name A-Z</option>
              <option value="email-desc">Name Z-A</option>
              <option value="activity_count-desc">Most Active</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="btn-secondary text-sm"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="btn-secondary text-sm"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="btn-danger text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-8">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th>User</th>
                <th>Subscription</th>
                <th>Status</th>
                <th>Role</th>
                <th>Activity</th>
                <th>Joined</th>
                <th className="w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.email}</p>
                        <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <span className={`badge ${
                        user.subscription === 'premium' ? 'badge-warning' : 'badge-secondary'
                      }`}>
                        {user.subscription === 'premium' && <StarIcon className="h-3 w-3 mr-1" />}
                        {user.subscription}
                      </span>
                      {user.subscription === 'premium' && user.subscription_expires_at && (
                        <span className="text-xs text-gray-500">
                          Until {new Date(user.subscription_expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      user.is_active ? 'badge-success' : 'badge-error'
                    }`}>
                      {user.is_active ? (
                        <>
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      user.role === 'admin' ? 'badge-info' : 'badge-secondary'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {user.activity_count || 0} actions
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-blue-600 hover:text-blue-700"
                        title="View details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/users/${user.id}/edit`}
                        className="text-green-600 hover:text-green-700"
                        title="Edit user"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleToggleUser(user.id, user.is_active)}
                        className="text-yellow-600 hover:text-yellow-700"
                        title={user.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {user.is_active ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete user"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first user.'
              }
            </p>
            {!searchTerm && filterType === 'all' && (
              <Link href="/admin/users/new" className="btn-primary">
                Add First User
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{users.length}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.is_active).length}
          </div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {users.filter(u => u.subscription === 'premium').length}
          </div>
          <div className="text-sm text-gray-600">Premium Users</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.role === 'admin').length}
          </div>
          <div className="text-sm text-gray-600">Administrators</div>
        </div>
      </div>
    </div>
  )
}
