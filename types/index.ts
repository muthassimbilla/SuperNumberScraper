// website/types/index.ts
// Type definitions for the server-controlled extension website

export interface User {
  id: string;
  email: string;
  subscription: 'free' | 'premium';
  subscription_expires_at?: string;
  is_active: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  error?: string;
}

export interface ExtensionConfig {
  id?: string;
  user_id?: string;
  title: string;
  version: string;
  theme: 'light' | 'dark' | 'auto';
  layout: string;
  features: Feature[];
  badge: {
    enabled: boolean;
    text?: string;
    color?: string;
  };
  supabase?: {
    url: string;
    anonKey: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface Feature {
  id?: string;
  name: string;
  title: string;
  description?: string;
  type: 'button' | 'editor' | 'display' | 'input' | 'toggle';
  premium: boolean;
  enabled: boolean;
  settings?: Record<string, any>;
  placeholder?: string;
  buttonLabel?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  usage_count?: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalFeatures: number;
  activeExtensions: number;
  serverStatus: 'online' | 'offline' | 'maintenance';
  usageStats: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    featureUsage: Record<string, number>;
    popularFeatures: Array<{ name: string; usage: number }>;
  };
}

export interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  user_id?: string;
  feature?: string;
  metadata?: Record<string, any>;
}

export interface UserData {
  id: string;
  user_id: string;
  feature: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Feature execution types
export interface FeatureExecutionRequest {
  feature: string;
  data?: Record<string, any>;
  user_id: string;
  action?: string;
  input?: any;
}

export interface FeatureExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  type?: 'text' | 'html' | 'download' | 'json';
  url?: string;
  filename?: string;
}

export interface FeatureExecutionResponse {
  success: boolean;
  result?: any;
  error?: string;
  message?: string;
}

// Configuration types
export interface ServerConfig {
  title: string;
  version: string;
  theme: string;
  layout: string;
  features: Feature[];
  badge: {
    enabled: boolean;
    text?: string;
    color?: string;
  };
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

// Analytics types
export interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  featureUsage: Record<string, number>;
  popularFeatures: Array<{ name: string; usage: number }>;
  growth: {
    newUsersLast30Days: number;
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
  };
}