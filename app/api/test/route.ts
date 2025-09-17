import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    success: true,
    message: 'API is working',
    data: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  })
}

export async function POST() {
  return NextResponse.json({ 
    success: true,
    message: 'POST request received',
    timestamp: new Date().toISOString()
  })
}
