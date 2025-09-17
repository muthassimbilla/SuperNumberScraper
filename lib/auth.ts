// website/lib/auth.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface AuthResult {
  isAuthorized: boolean;
  userId?: string;
  user?: any;
  error?: string;
}

interface RateLimiter {
  attempts: Map<string, { count: number; lastAttempt: number }>;
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

// Rate limiter for login attempts
class LoginRateLimiter implements RateLimiter {
  attempts = new Map<string, { count: number; lastAttempt: number }>();
  maxAttempts = 5;
  windowMs = 15 * 60 * 1000; // 15 minutes
  blockDurationMs = 30 * 60 * 1000; // 30 minutes

  isBlocked(identifier: string): boolean {
    const attempt = this.attempts.get(identifier);
    if (!attempt) return false;

    const now = Date.now();
    const timeSinceLastAttempt = now - attempt.lastAttempt;

    // Reset if window has passed
    if (timeSinceLastAttempt > this.windowMs) {
      this.attempts.delete(identifier);
      return false;
    }

    // Check if blocked
    if (attempt.count >= this.maxAttempts) {
      return timeSinceLastAttempt < this.blockDurationMs;
    }

    return false;
  }

  recordAttempt(identifier: string): void {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);

    if (!attempt) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
    } else {
      const timeSinceLastAttempt = now - attempt.lastAttempt;
      
      // Reset if window has passed
      if (timeSinceLastAttempt > this.windowMs) {
        this.attempts.set(identifier, { count: 1, lastAttempt: now });
      } else {
        this.attempts.set(identifier, { 
          count: attempt.count + 1, 
          lastAttempt: now 
        });
      }
    }
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Create rate limiter instance
export const loginRateLimiter = new LoginRateLimiter();

// AuthManager class for backward compatibility
export class AuthManager {
  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  static verifyToken(token: string): any {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  static generateToken(user: any): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload = {
      userId: user.id,
      email: user.email,
      subscription: user.subscription,
      role: user.role || 'user',
      isAdmin: user.role === 'admin' || user.is_admin,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return jwt.sign(payload, process.env.JWT_SECRET);
  }

  static generateRefreshToken(user: any): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload = {
      userId: user.id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    return jwt.sign(payload, process.env.JWT_SECRET);
  }

  static hasPermission(user: any, permission: string): boolean {
    if (!user) return false;
    
    if (permission === 'admin') {
      return user.isAdmin || user.role === 'admin' || user.is_admin;
    }
    
    return true; // For now, allow all other permissions
  }

  static hasPremiumAccess(user: any): boolean {
    if (!user) return false;
    
    // Check if user has premium subscription
    if (user.subscription === 'premium') {
      // Check if subscription is not expired
      if (user.subscription_expires_at) {
        const expiryDate = new Date(user.subscription_expires_at);
        return expiryDate > new Date();
      }
      return true;
    }
    
    return false;
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Verify JWT token from request headers
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        isAuthorized: false,
        error: 'No authorization header found'
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return {
        isAuthorized: false,
        error: 'Server configuration error'
      };
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    if (!decoded.userId) {
      return {
        isAuthorized: false,
        error: 'Invalid token payload'
      };
    }

    return {
      isAuthorized: true,
      userId: decoded.userId,
      user: decoded
    };

  } catch (error: any) {
    console.error('Auth verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return {
        isAuthorized: false,
        error: 'Token expired'
      };
    }
    
    if (error.name === 'JsonWebTokenError') {
      return {
        isAuthorized: false,
        error: 'Invalid token'
      };
    }

    return {
      isAuthorized: false,
      error: 'Authentication failed'
    };
  }
}

// Generate JWT token for user
export function generateToken(userId: string, userData: any = {}): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  const payload = {
    userId,
    ...userData,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };

  return jwt.sign(payload, process.env.JWT_SECRET);
}

// Verify admin token (for admin routes)
export async function verifyAdminAuth(request: NextRequest): Promise<AuthResult> {
  const authResult = await verifyAuth(request);
  
  if (!authResult.isAuthorized) {
    return authResult;
  }

  // Check if user is admin (you can implement your own admin check logic)
  // For now, we'll check if the user has admin role in the token
  if (!authResult.user?.isAdmin && !authResult.user?.role?.includes('admin')) {
    return {
      isAuthorized: false,
      error: 'Admin access required'
    };
  }

  return authResult;
}