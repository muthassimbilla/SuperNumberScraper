'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  PuzzlePieceIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  StarIcon,
  ChevronLeftIcon as ToggleLeftIcon,
  ChevronRightIcon as ToggleRightIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  CommandLineIcon,
  CursorArrowRippleIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface Feature {
  id: string
  name: string
  title: string
  description?: string
  type: 'button' | 'editor' | 'display' | 'input' | 'toggle'
  premium: boolean
  enabled: boolean
  settings?: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at?: string
  usage_count?: number
}

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchFeatures()
  }, [])

  const fetchFeatures = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/features', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch features')
      }

      const data = await response.json()
      if (data.success) {
        setFeatures(data.data || [])
      } else {
        throw new Error(data.error || 'Failed to fetch features')
      }
    } catch (error: any) {
      console.error('Features fetch error:', error)
      toast.error('Failed to load features')
      // Mock data for demo
      setFeatures([
        {
          id: '1',
          name: 'note_taking',
          title: 'Note Taking',
          description: 'Take and save notes with rich text editor',
          type: 'editor',
          premium: false,
          enabled: true,
          is_active: true,
          created_at: '2025-01-15T10:30:00Z',
          usage_count: 156,
          settings: { maxLength: 10000 }
        },
        {
          id: '2',
          name: 'pdf_export',
          title: 'PDF Export',
          description: 'Export content as PDF with custom formatting',
          type: 'button',
          premium: true,
          enabled: true,
          is_active: true,
          created_at: '2025-01-20T14:20:00Z',
          usage_count: 89,
          settings: { format: 'A4', quality: 'high' }
        },
        {
          id: '3',
          name: 'data_sync',
          title: 'Data Sync',
          description: 'Synchronize data across devices',
          type: 'toggle',
          premium: false,
          enabled: true,
          is_active: true,
          created_at: '2025-02-01T09:15:00Z',
          usage_count: 234,
          settings: { autoSync: true }
        },
        {
          id: '4',
          name: 'custom_themes',
          title: 'Custom Themes',
          description: 'Customize appearance with themes',
          type: 'button',
          premium: true,
          enabled: false,
          is_active: true,
          created_at: '2025-02-10T16:45:00Z',
          usage_count: 45,
          settings: { themes: ['light', 'dark', 'auto'] }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFeature = async (featureId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/features/${featureId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: !currentStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle feature')
      }

      setFeatures(features.map(feature => 
        feature.id === featureId 
          ? { ...feature, enabled: !currentStatus }
          : feature
      ))
      toast.success(`Feature ${!currentStatus ? 'enabled' : 'disabled'} successfully`)
    } catch (error) {
      toast.error('Failed to toggle feature')
    }
  }

  const handleTogglePremium = async (featureId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/features/${featureId}/premium`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ premium: !currentStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update premium status')
      }

      setFeatures(features.map(feature => 
        feature.id === featureId 
          ? { ...feature, premium: !currentStatus }
          : feature
      ))
      toast.success(`Feature ${!currentStatus ? 'marked as premium' : 'made free'} successfully`)
    } catch (error) {
      toast.error('Failed to update premium status')
    }
  }

  const handleDeleteFeature = async (featureId: string) => {
    if (!confirm('Are you sure you want to delete this feature? This action cannot be undone.')) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/features/${featureId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete feature')
      }

      setFeatures(features.filter(feature => feature.id !== featureId))
      toast.success('Feature deleted successfully')
    } catch (error) {
      toast.error('Failed to delete feature')
    }
  }

  // Filter features
  const filteredFeatures = features.filter(feature => {
    const matchesSearch = 
      feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (feature.description && feature.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = 
      filterType === 'all' ||
      filterType === feature.type ||
      (filterType === 'premium' && feature.premium) ||
      (filterType === 'free' && !feature.premium) ||
      (filterType === 'enabled' && feature.enabled) ||
      (filterType === 'disabled' && !feature.enabled)
    
    return matchesSearch && matchesFilter
  })

  const getFeatureIcon = (type: string) => {
    switch (type) {
      case 'button':
        return CursorArrowRippleIcon
      case 'editor':
        return DocumentTextIcon
      case 'display':
        return EyeIcon
      case 'input':
        return CommandLineIcon
      case 'toggle':
        return ToggleRightIcon
      default:
        return PuzzlePieceIcon
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'button':
        return 'bg-blue-100 text-blue-800'
      case 'editor':
        return 'bg-green-100 text-green-800'
      case 'display':
        return 'bg-purple-100 text-purple-800'
      case 'input':
        return 'bg-yellow-100 text-yellow-800'
      case 'toggle':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 pulse-loading"></div>
          <div className="h-10 bg-gray-200 rounded w-32 pulse-loading"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card pulse-loading h-48"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Features</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage {features.length} extension features
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Feature
          </button>
          <Link href="/admin/features/bulk" className="btn-secondary">
            Bulk Actions
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="form-input"
            >
              <option value="all">All Features</option>
              <option value="button">Buttons</option>
              <option value="editor">Editors</option>
              <option value="display">Displays</option>
              <option value="input">Inputs</option>
              <option value="toggle">Toggles</option>
              <option value="premium">Premium Only</option>
              <option value="free">Free Only</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeatures.map((feature) => {
          const IconComponent = getFeatureIcon(feature.type)
          
          return (
            <div key={feature.id} className="card hover:shadow-lg transition-shadow duration-200">
              {/* Feature Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(feature.type)}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-500 font-mono">{feature.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {feature.premium && (
                    <StarIcon className="h-4 w-4 text-yellow-500" title="Premium Feature" />
                  )}
                  <div className={`w-2 h-2 rounded-full ${
                    feature.enabled ? 'bg-green-500' : 'bg-gray-400'
                  }`} title={feature.enabled ? 'Enabled' : 'Disabled'}></div>
                </div>
              </div>

              {/* Feature Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {feature.description || 'No description available'}
              </p>

              {/* Feature Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {feature.usage_count || 0}
                  </div>
                  <div className="text-xs text-gray-500">Uses</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${
                    feature.type === 'button' ? 'text-blue-600' :
                    feature.type === 'editor' ? 'text-green-600' :
                    feature.type === 'display' ? 'text-purple-600' :
                    feature.type === 'input' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {feature.type}
                  </div>
                  <div className="text-xs text-gray-500">Type</div>
                </div>
              </div>

              {/* Feature Controls */}
              <div className="space-y-3">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Status</span>
                  <button
                    onClick={() => handleToggleFeature(feature.id, feature.enabled)}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-colors ${
                      feature.enabled 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {feature.enabled ? (
                      <ToggleRightIcon className="h-4 w-4" />
                    ) : (
                      <ToggleLeftIcon className="h-4 w-4" />
                    )}
                    <span>{feature.enabled ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>

                {/* Premium Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Premium</span>
                  <button
                    onClick={() => handleTogglePremium(feature.id, feature.premium)}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-colors ${
                      feature.premium 
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <StarIcon className="h-4 w-4" />
                    <span>{feature.premium ? 'Premium' : 'Free'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Link
                    href={`/admin/features/${feature.id}`}
                    className="text-blue-600 hover:text-blue-700"
                    title="View details"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/admin/features/${feature.id}/edit`}
                    className="text-green-600 hover:text-green-700"
                    title="Edit feature"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/admin/features/${feature.id}/settings`}
                    className="text-purple-600 hover:text-purple-700"
                    title="Feature settings"
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                  </Link>
                </div>
                
                <button
                  onClick={() => handleDeleteFeature(feature.id)}
                  className="text-red-600 hover:text-red-700"
                  title="Delete feature"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredFeatures.length === 0 && (
        <div className="text-center py-12">
          <PuzzlePieceIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No features found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first feature.'
            }
          </p>
          {!searchTerm && filterType === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create First Feature
            </button>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{features.length}</div>
          <div className="text-sm text-gray-600">Total Features</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {features.filter(f => f.enabled).length}
          </div>
          <div className="text-sm text-gray-600">Enabled</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {features.filter(f => f.premium).length}
          </div>
          <div className="text-sm text-gray-600">Premium</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {features.reduce((sum, f) => sum + (f.usage_count || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Total Uses</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {new Set(features.map(f => f.type)).size}
          </div>
          <div className="text-sm text-gray-600">Types</div>
        </div>
      </div>

      {/* Create Feature Modal */}
      {showCreateModal && (
        <CreateFeatureModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchFeatures()
          }}
        />
      )}
    </div>
  )
}

// Create Feature Modal Component
function CreateFeatureModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    type: 'button',
    premium: false,
    enabled: true
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.title) {
      toast.error('Name and title are required')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/features', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to create feature')
      }

      toast.success('Feature created successfully')
      onSuccess()
    } catch (error) {
      toast.error('Failed to create feature')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Feature</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Feature Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="form-input"
              placeholder="e.g., note_taking"
              required
            />
          </div>
          
          <div>
            <label className="form-label">Display Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="form-input"
              placeholder="e.g., Note Taking"
              required
            />
          </div>
          
          <div>
            <label className="form-label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="form-input"
              rows={3}
              placeholder="Describe what this feature does..."
            />
          </div>
          
          <div>
            <label className="form-label">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="form-input"
            >
              <option value="button">Button</option>
              <option value="editor">Editor</option>
              <option value="display">Display</option>
              <option value="input">Input</option>
              <option value="toggle">Toggle</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.premium}
                onChange={(e) => setFormData({...formData, premium: e.target.checked})}
                className="rounded border-gray-300 mr-2"
              />
              Premium Feature
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
                className="rounded border-gray-300 mr-2"
              />
              Enabled
            </label>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Feature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
