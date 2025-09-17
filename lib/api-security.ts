// API Security Utilities - Hide database type and structure

export function obfuscateResponse(data: any, type: 'success' | 'error' = 'success') {
  // Generic response structure that doesn't reveal database type
  const baseResponse = {
    success: type === 'success',
    timestamp: Date.now(),
    version: '1.0.0'
  }

  if (type === 'success') {
    return {
      ...baseResponse,
      data: data,
      message: 'Operation completed successfully'
    }
  } else {
    return {
      ...baseResponse,
      error: data,
      message: 'Operation failed'
    }
  }
}

export function sanitizeError(error: any) {
  // Hide database-specific error messages
  const genericErrors: { [key: string]: string } = {
    'relation "user_data" does not exist': 'Data service unavailable',
    'duplicate key value violates unique constraint': 'Data already exists',
    'permission denied for table': 'Access denied',
    'connection refused': 'Service temporarily unavailable',
    'timeout': 'Request timeout',
    'network error': 'Network error'
  }

  const errorMessage = error.message || error.toString()
  
  // Check for database-specific errors
  for (const [dbError, genericError] of Object.entries(genericErrors)) {
    if (errorMessage.toLowerCase().includes(dbError.toLowerCase())) {
      return genericError
    }
  }

  // Return generic error for unknown errors
  return 'An unexpected error occurred'
}

export function generateGenericId() {
  // Generate generic-looking IDs that don't reveal database type
  return 'item_' + Math.random().toString(36).substr(2, 9)
}

export function obfuscateDatabaseFields(data: any): any {
  // Remove or rename database-specific fields
  if (Array.isArray(data)) {
    return data.map(item => obfuscateDatabaseFields(item))
  }

  if (typeof data === 'object' && data !== null) {
    const obfuscated = { ...data }
    
    // Remove database-specific fields
    delete obfuscated.created_at
    delete obfuscated.updated_at
    delete obfuscated.user_id
    delete obfuscated.id
    
    // Add generic fields
    obfuscated.timestamp = Date.now()
    obfuscated.item_id = generateGenericId()
    
    return obfuscated
  }

  return data
}

export function createGenericAPIResponse(data: any, options: {
  hideDatabaseType?: boolean
  obfuscateFields?: boolean
  addGenericMetadata?: boolean
} = {}) {
  const {
    hideDatabaseType = true,
    obfuscateFields = true,
    addGenericMetadata = true
  } = options

  let responseData = data

  if (obfuscateFields) {
    responseData = obfuscateDatabaseFields(data)
  }

  const response: any = {
    success: true,
    data: responseData
  }

  if (addGenericMetadata) {
    response.metadata = {
      api_version: '1.0.0',
      response_time: Date.now(),
      request_id: generateGenericId()
    }
  }

  if (hideDatabaseType) {
    // Add generic service information
    response.service = {
      name: 'Smart Notes API',
      version: '1.0.0',
      status: 'operational'
    }
  }

  return response
}
