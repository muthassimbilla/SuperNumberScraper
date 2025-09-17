// Server Controlled Extension - Supabase Integration
// Note: These credentials will be fetched from server config in production
let SUPABASE_URL = "https://your-project.supabase.co";
let SUPABASE_KEY = "your-anon-key";

// Function to get location from area code
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

class SupabaseAPI {
    static async saveNumber(normalizedNumber, originalFormat = null) {
        try {
            // Get location and area code
            const location = getLocationFromAreaCode(normalizedNumber);
            const areaCode = extractAreaCode(normalizedNumber);
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/copied_numbers`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ 
                    number: normalizedNumber,
                    original_format: originalFormat || normalizedNumber,
                    location: location,
                    area_code: areaCode
                })
            });

            // If response is 409 (conflict), it means the number already exists
            if (response.status === 409) {
                console.log('Number already exists in database');
                return true; // Still consider it a success since the number is already saved
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Error saving number:', error);
            return false;
        }
    }

    static async getNumbers() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/copied_numbers?select=number`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.map(item => item.number);
        } catch (error) {
            console.error('Error fetching numbers:', error);
            throw error;
        }
    }

    // Additional method to get numbers with their original formats and locations
    static async getNumbersWithFormats() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/copied_numbers?select=number,original_format,location,area_code,created_at&order=created_at.desc`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching numbers with formats:', error);
            throw error;
        }
    }

    // Method to check if a normalized number already exists
    static async numberExists(normalizedNumber) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/copied_numbers?select=number&number=eq.${normalizedNumber}`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.length > 0;
        } catch (error) {
            console.error('Error checking number existence:', error);
            return false;
        }
    }

    // Method to get numbers by location
    static async getNumbersByLocation(location) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/copied_numbers?select=*&location=ilike.%${location}%&order=created_at.desc`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching numbers by location:', error);
            throw error;
        }
    }

    // Method to get numbers by area code
    static async getNumbersByAreaCode(areaCode) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/copied_numbers?select=*&area_code=eq.${areaCode}&order=created_at.desc`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching numbers by area code:', error);
            throw error;
        }
    }
}

// Supabase Authentication API
class SupabaseAuth {
    // Update Supabase configuration from server
    static updateConfig(url, key) {
        SUPABASE_URL = url;
        SUPABASE_KEY = key;
        console.log('Supabase config updated:', { url, key: key.substring(0, 20) + '...' });
    }

    // Sign in with email and password
    static async signIn(email, password) {
        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error_description || error.message || 'Login failed');
            }

            const data = await response.json();
            
            return {
                success: true,
                user: data.user,
                session: data
            };
        } catch (error) {
            console.error('Supabase sign in error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Sign up with email and password
    static async signUp(email, password, metadata = {}) {
        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    data: metadata
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error_description || error.message || 'Signup failed');
            }

            const data = await response.json();
            
            return {
                success: true,
                user: data.user,
                session: data
            };
        } catch (error) {
            console.error('Supabase sign up error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Sign out
    static async signOut(accessToken) {
        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return { success: response.ok };
        } catch (error) {
            console.error('Supabase sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user profile
    static async getUser(accessToken) {
        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get user');
            }

            const user = await response.json();
            return { success: true, user };
        } catch (error) {
            console.error('Get user error:', error);
            return { success: false, error: error.message };
        }
    }

    // Refresh access token
    static async refreshToken(refreshToken) {
        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refresh_token: refreshToken
                })
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            return { success: true, session: data };
        } catch (error) {
            console.error('Refresh token error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Enhanced Supabase Data API with authentication
class SupabaseDataAPI {
    // Save user data
    static async saveUserData(userId, feature, data, accessToken) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/user_data`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    user_id: userId,
                    feature,
                    data,
                    created_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return { success: true };
        } catch (error) {
            console.error('Error saving user data:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user data
    static async getUserData(userId, feature, accessToken) {
        try {
            let url = `${SUPABASE_URL}/rest/v1/user_data?user_id=eq.${userId}`;
            if (feature) {
                url += `&feature=eq.${feature}`;
            }
            url += '&order=created_at.desc';

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching user data:', error);
            return { success: false, error: error.message };
        }
    }

    // Update user data
    static async updateUserData(id, data, accessToken) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/user_data?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data,
                    updated_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return { success: true };
        } catch (error) {
            console.error('Error updating user data:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete user data
    static async deleteUserData(id, accessToken) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/user_data?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return { success: true };
        } catch (error) {
            console.error('Error deleting user data:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export to window object for access from popup
window.supabase = SupabaseAPI;
window.supabaseAuth = SupabaseAuth;
window.supabaseData = SupabaseDataAPI;
window.getLocationFromAreaCode = getLocationFromAreaCode;
window.extractAreaCode = extractAreaCode;