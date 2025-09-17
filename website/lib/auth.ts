import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { AuthTokenPayload, User } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production'
const TOKEN_EXPIRY = '7d' // 7 days
const REFRESH_TOKEN_EXPIRY = '30d' // 30 days

export class AuthManager {
  // Generate JWT token
  static generateToken(user: User): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role || 'user',
      subscription: user.subscription,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }

    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
  }

  // Generate refresh token
  static generateRefreshToken(user: User): string {
    return jwt.sign(
      { userId: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    )
  }

  // Verify JWT token
  static verifyToken(token: string): AuthTokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload
      return decoded
    } catch (error) {
      console.error('Token verification failed:', error)
      return null
    }
  }

  // Verify refresh token
  static verifyRefreshToken(refreshToken: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as any
      if (decoded.type === 'refresh') {
        return { userId: decoded.userId }
      }
      return null
    } catch (error) {
      console.error('Refresh token verification failed:', error)
      return null
    }
  }

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword)
  }

  // Extract token from Authorization header
  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    return authHeader.slice(7) // Remove 'Bearer ' prefix
  }

  // Check if user has permission
  static hasPermission(user: AuthTokenPayload, requiredRole: 'user' | 'admin'): boolean {
    if (requiredRole === 'admin') {
      return user.role === 'admin'
    }
    return true // All authenticated users have 'user' permission
  }

  // Check if user has premium subscription
  static hasPremiumAccess(user: AuthTokenPayload): boolean {
    return user.subscription === 'premium'
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate password strength
  static isValidPassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' }
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' }
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' }
    }
    
    if (!/(?=.*\d)/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' }
    }

    return { valid: true }
  }

  // Generate random password
  static generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    
    return password
  }

  // Rate limiting helper
  static createRateLimiter() {
    const attempts: Map<string, { count: number; resetTime: number }> = new Map()
    const MAX_ATTEMPTS = 5
    const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

    return {
      isBlocked: (identifier: string): boolean => {
        const now = Date.now()
        const attempt = attempts.get(identifier)
        
        if (!attempt) return false
        
        if (now > attempt.resetTime) {
          attempts.delete(identifier)
          return false
        }
        
        return attempt.count >= MAX_ATTEMPTS
      },
      
      recordAttempt: (identifier: string): void => {
        const now = Date.now()
        const attempt = attempts.get(identifier)
        
        if (!attempt || now > attempt.resetTime) {
          attempts.set(identifier, { count: 1, resetTime: now + WINDOW_MS })
        } else {
          attempt.count++
        }
      },
      
      reset: (identifier: string): void => {
        attempts.delete(identifier)
      }
    }
  }
}

// Rate limiter instance for login attempts
export const loginRateLimiter = AuthManager.createRateLimiter()

// Middleware helper for API routes
export function withAuth(handler: Function, options: { requireAdmin?: boolean } = {}) {
  return async (req: any, res: any) => {
    try {
      const authHeader = req.headers.authorization
      const token = AuthManager.extractTokenFromHeader(authHeader)
      
      if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided' })
      }
      
      const user = AuthManager.verifyToken(token)
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid token' })
      }
      
      if (options.requireAdmin && !AuthManager.hasPermission(user, 'admin')) {
        return res.status(403).json({ success: false, error: 'Admin access required' })
      }
      
      // Add user to request object
      req.user = user
      
      return handler(req, res)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
}

// Helper to get user from request
export function getUserFromRequest(req: any): AuthTokenPayload | null {
  return req.user || null
}
