// User Types
export interface User {
  id: string
  email: string
  created_at: string
  updated_at?: string
  subscription: 'free' | 'premium'
  subscription_expires_at?: string
  is_active: boolean
  metadata?: Record<string, any>
  role?: 'user' | 'admin'
}

// Extension Configuration Types
export interface ExtensionConfig {
  id: string
  user_id?: string // null for global config
  title: string
  version: string
  theme: 'light' | 'dark'
  layout: string
  features: Feature[]
  badge?: BadgeConfig
  supabase?: SupabaseConfig
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface Feature {
  name: string
  title: string
  type: 'button' | 'editor' | 'display' | 'input' | 'toggle'
  premium: boolean
  enabled: boolean
  description?: string
  placeholder?: string
  label?: string
  buttonLabel?: string
  content?: string
  options?: FeatureOption[]
  settings?: Record<string, any>
}

export interface FeatureOption {
  label: string
  value: string
  selected?: boolean
}

export interface BadgeConfig {
  enabled: boolean
  text?: string
  color?: string
}

export interface SupabaseConfig {
  url: string
  anonKey: string
}

// User Data Types
export interface UserData {
  id: string
  user_id: string
  feature: string
  data: any
  created_at: string
  updated_at?: string
}

// Subscription Types
export interface Subscription {
  id: string
  user_id: string
  type: 'free' | 'premium'
  status: 'active' | 'expired' | 'cancelled'
  starts_at: string
  expires_at?: string
  created_at: string
  updated_at?: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Feature Execution Types
export interface FeatureExecutionRequest {
  user_id: string
  feature: string
  action?: string
  input?: any
}

export interface FeatureExecutionResult {
  success: boolean
  output?: string
  type?: 'text' | 'html' | 'download' | 'clipboard'
  url?: string
  filename?: string
  text?: string
  error?: string
}

// Admin Dashboard Types
export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  premiumUsers: number
  totalFeatures: number
  activeExtensions: number
  serverStatus: 'online' | 'offline' | 'maintenance'
  usageStats: UsageStats
}

export interface UsageStats {
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  featureUsage: Record<string, number>
  popularFeatures: Array<{ name: string; usage: number }>
}

// Authentication Types
export interface AuthTokenPayload {
  userId: string
  email: string
  role: string
  subscription: string
  iat: number
  exp: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  user?: User
  token?: string
  refreshToken?: string
  error?: string
}

// Theme Types
export interface Theme {
  id: string
  name: string
  colors: {
    primary: string
    secondary: string
    success: string
    error: string
    warning: string
    info: string
    background: string
    text: string
  }
  components: Record<string, any>
}

// Layout Types
export interface Layout {
  id: string
  name: string
  description: string
  structure: LayoutComponent[]
  metadata?: Record<string, any>
}

export interface LayoutComponent {
  type: 'header' | 'content' | 'footer' | 'sidebar'
  props?: Record<string, any>
  children?: LayoutComponent[]
}

// Form Types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio'
  required?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: string }>
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    custom?: (value: any) => boolean | string
  }
}

// Webhook Types
export interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  secret?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

// Logging Types
export interface LogEntry {
  id: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  user_id?: string
  feature?: string
  metadata?: Record<string, any>
  timestamp: string
}

// File Upload Types
export interface FileUpload {
  id: string
  filename: string
  original_name: string
  mime_type: string
  size: number
  url: string
  user_id: string
  created_at: string
}

// Settings Types
export interface SystemSettings {
  id: string
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'json'
  description?: string
  is_public: boolean
  updated_at: string
}

// Notification Types
export interface Notification {
  id: string
  user_id?: string // null for global notifications
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
  expires_at?: string
}

// Export all types
export type {
  User,
  ExtensionConfig,
  Feature,
  FeatureOption,
  BadgeConfig,
  SupabaseConfig,
  UserData,
  Subscription,
  ApiResponse,
  PaginatedResponse,
  FeatureExecutionRequest,
  FeatureExecutionResult,
  DashboardStats,
  UsageStats,
  AuthTokenPayload,
  LoginRequest,
  LoginResponse,
  Theme,
  Layout,
  LayoutComponent,
  FormField,
  WebhookConfig,
  LogEntry,
  FileUpload,
  SystemSettings,
  Notification
}
