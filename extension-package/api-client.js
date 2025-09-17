// Smart Notes Extension - API Client
// All data operations go through secure server API

// API Configuration - Generic endpoints to hide database type
const API_CONFIG = {
  BASE_URL: 'https://your-website.vercel.app/api/v1', // Update with your production URL
  ENDPOINTS: {
    AUTH: '/auth',
    NOTES: '/notes',
    FEATURES: '/features',
    CONFIG: '/config'
  }
};

// Function to get location from area code (for phone number features)
function getLocationFromAreaCode(phoneNumber) {
    // Extract area code from phone number
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Handle different phone number formats
    let areaCode = '';
    
    if (digits.length === 11 && digits.startsWith('1')) {
        // Format: 1-XXX-XXX-XXXX
        areaCode = digits.substring(1, 4);
    } else if (digits.length === 10) {
        // Format: XXX-XXX-XXXX
        areaCode = digits.substring(0, 3);
    } else {
        return null; // Invalid format
    }
    
    return window.AREA_CODES[areaCode] || "Unknown Location";
}

// Function to extract area code from phone number
function extractAreaCode(phoneNumber) {
    const digits = phoneNumber.replace(/\D/g, '');
    
    if (digits.length === 11 && digits.startsWith('1')) {
        return digits.substring(1, 4);
    } else if (digits.length === 10) {
        return digits.substring(0, 3);
    }
    
    return null;
}

// Secure API Client - All operations go through server
class SecureAPI {
    // Get authentication token from storage
    static async getAuthToken() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['authToken'], (result) => {
                resolve(result.authToken || null);
            });
        });
    }

    // Make authenticated API call
    static async makeRequest(endpoint, method = 'GET', data = null) {
        try {
            const token = await this.getAuthToken();
            
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || ''}`
                }
            };

            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Authentication methods
    static async signIn(email, password) {
        return await this.makeRequest(`${API_CONFIG.ENDPOINTS.AUTH}/login`, 'POST', {
            email,
            password
        });
    }

    static async signUp(email, password, metadata = {}) {
        return await this.makeRequest(`${API_CONFIG.ENDPOINTS.AUTH}/signup`, 'POST', {
            email,
            password,
            metadata
        });
    }

    static async signOut() {
        return await this.makeRequest(`${API_CONFIG.ENDPOINTS.AUTH}/logout`, 'POST');
    }

    static async getUser() {
        return await this.makeRequest(`${API_CONFIG.ENDPOINTS.AUTH}/me`);
    }

    static async refreshToken() {
        return await this.makeRequest(`${API_CONFIG.ENDPOINTS.AUTH}/refresh`, 'POST');
    }

    // Data management methods - Generic endpoints
    static async saveUserData(feature, data) {
        if (feature === 'notes') {
            return await this.makeRequest(`${API_CONFIG.ENDPOINTS.NOTES}`, 'POST', {
                content: data,
                type: 'note'
            });
        }
        // For other features, use generic features endpoint
        return await this.makeRequest(`${API_CONFIG.ENDPOINTS.FEATURES}`, 'POST', {
            action: 'save',
            feature,
            data
        });
    }

    static async getUserData(feature = null) {
        if (feature === 'notes') {
            return await this.makeRequest(`${API_CONFIG.ENDPOINTS.NOTES}`);
        }
        // For other features, use generic features endpoint
        return await this.makeRequest(`${API_CONFIG.ENDPOINTS.FEATURES}`, 'POST', {
            action: 'list',
            feature
        });
    }

    static async updateUserData(id, data) {
        return await this.makeRequest(`${API_CONFIG.ENDPOINTS.FEATURES}`, 'POST', {
            action: 'update',
            feature: 'user_data',
            data: { id, ...data }
        });
    }

    static async deleteUserData(id) {
        return await this.makeRequest(`${API_CONFIG.ENDPOINTS.FEATURES}`, 'POST', {
            action: 'delete',
            feature: 'user_data',
            data: { id }
        });
    }

    // Configuration methods
    static async getConfig() {
        return await this.makeRequest(API_CONFIG.ENDPOINTS.CONFIG);
    }

    static async updateConfig(config) {
        return await this.makeRequest(API_CONFIG.ENDPOINTS.CONFIG, 'POST', {
            config
        });
    }

    // Feature execution
    static async executeFeature(feature, action, input = null) {
        return await this.makeRequest(`${API_CONFIG.ENDPOINTS.FEATURES}/execute`, 'POST', {
            feature,
            action,
            input
        });
    }

    // Phone number specific methods (if needed)
    static async savePhoneNumber(normalizedNumber, originalFormat = null) {
        const location = getLocationFromAreaCode(normalizedNumber);
        const areaCode = extractAreaCode(normalizedNumber);
        
        return await this.saveUserData('phone_numbers', {
            number: normalizedNumber,
            original_format: originalFormat,
            location,
            area_code: areaCode,
            created_at: new Date().toISOString()
        });
    }

    static async getPhoneNumbers() {
        return await this.getUserData('phone_numbers');
    }
}

// Legacy Auth class for backward compatibility
class AuthAPI {
    static async signIn(email, password) {
        const result = await SecureAPI.signIn(email, password);
        return {
            success: result.success,
            user: result.user,
            session: result.session,
            error: result.error
        };
    }

    static async signUp(email, password, metadata = {}) {
        const result = await SecureAPI.signUp(email, password, metadata);
        return {
            success: result.success,
            user: result.user,
            session: result.session,
            error: result.error
        };
    }

    static async signOut() {
        const result = await SecureAPI.signOut();
        return {
            success: result.success,
            error: result.error
        };
    }

    static async getUser() {
        const result = await SecureAPI.getUser();
        return {
            success: result.success,
            user: result.user,
            error: result.error
        };
    }

    static async refreshToken() {
        const result = await SecureAPI.refreshToken();
        return {
            success: result.success,
            session: result.session,
            error: result.error
        };
    }

    // Update config method (no longer needed but kept for compatibility)
    static updateConfig(url, key) {
        console.log('Config update no longer needed - using server API');
    }
}

// Legacy DataAPI class for backward compatibility
class DataAPI {
    static async saveUserData(userId, feature, data, accessToken) {
        const result = await SecureAPI.saveUserData(feature, data);
        return {
            success: result.success,
            error: result.error
        };
    }

    static async getUserData(userId, feature, accessToken) {
        const result = await SecureAPI.getUserData(feature);
        return {
            success: result.success,
            data: result.data,
            error: result.error
        };
    }

    static async updateUserData(id, data, accessToken) {
        const result = await SecureAPI.updateUserData(id, data);
        return {
            success: result.success,
            error: result.error
        };
    }

    static async deleteUserData(id, accessToken) {
        const result = await SecureAPI.deleteUserData(id);
        return {
            success: result.success,
            error: result.error
        };
    }
}

// Export to window object for access from popup
window.apiClient = SecureAPI; // Main API client
window.authAPI = AuthAPI; // Legacy auth methods
window.dataAPI = DataAPI; // Legacy data methods
window.getLocationFromAreaCode = getLocationFromAreaCode; // Phone utilities
window.extractAreaCode = extractAreaCode; // Phone utilities

// Security notice
console.log('🔒 Smart Notes Extension: Using secure server API - no database credentials exposed');