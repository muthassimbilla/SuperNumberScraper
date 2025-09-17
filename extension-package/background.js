// Smart Notes Extension - Background Script
// Production-ready background service worker

// Extension configuration - SECURE VERSION
const CONFIG = {
  API_BASE_URL: 'https://your-website.vercel.app/api/v1', // Generic API endpoints
  DEFAULT_SERVER_URL: 'https://your-website.vercel.app' // Update with your production URL
  // ✅ All operations go through secure server API
};

// Extension startup - Initialize and fetch server config
chrome.runtime.onStartup.addListener(async () => {
  console.log('Smart Notes Extension - Starting up...');
  await initializeExtension();
});

// Extension installation - Setup and fetch initial config
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Smart Notes Extension - Installed:', details.reason);
  
  if (details.reason === 'install') {
    // First time installation
    await chrome.storage.local.set({
      isLoggedIn: false,
      user: null,
      lastConfigFetch: null,
      serverConfig: null,
      installDate: Date.now()
    });
    
    // Show welcome message
    chrome.action.setBadgeText({ text: 'NEW' });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  }
  
  await initializeExtension();
});

// Initialize extension by fetching server configuration
async function initializeExtension() {
  try {
    // Check if user is logged in
    const result = await chrome.storage.local.get(['isLoggedIn', 'user', 'authToken']);
    
    if (!result.isLoggedIn || !result.user) {
      console.log('User not logged in - will show login screen');
      return;
    }
    
    // Fetch latest config from server
    await fetchServerConfig(result.user.id, result.authToken);
    
  } catch (error) {
    console.error('Error initializing extension:', error);
  }
}

// Fetch configuration from server
async function fetchServerConfig(userId, authToken) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/config?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Server config fetch failed: ${response.status}`);
    }
    
    const config = await response.json();
    
    // Store config in local storage
    await chrome.storage.local.set({
      serverConfig: config,
      lastConfigFetch: Date.now()
    });
    
    console.log('Server config fetched successfully');
    
    // Update badge if needed
    if (config.badge && config.badge.enabled) {
      chrome.action.setBadgeText({ text: config.badge.text || '' });
      chrome.action.setBadgeBackgroundColor({ color: config.badge.color || '#2196F3' });
    } else {
      // Clear badge if not needed
      chrome.action.setBadgeText({ text: '' });
    }
    
    return config;
    
  } catch (error) {
    console.error('Error fetching server config:', error);
    
    // Load cached config if available
    const cached = await chrome.storage.local.get(['serverConfig']);
    if (cached.serverConfig) {
      console.log('Using cached server config');
      return cached.serverConfig;
    }
    
    throw error;
  }
}

// Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Will respond asynchronously
});

// Message handler
async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.action) {
      case 'getServerConfig':
        const result = await chrome.storage.local.get(['serverConfig', 'user', 'authToken']);
        if (result.serverConfig) {
          sendResponse({ success: true, config: result.serverConfig });
        } else {
          // Try to fetch fresh config
          if (result.user && result.authToken) {
            const config = await fetchServerConfig(result.user.id, result.authToken);
            sendResponse({ success: true, config });
          } else {
            sendResponse({ success: false, error: 'No config available - user not logged in' });
          }
        }
        break;
        
      case 'refreshConfig':
        const userData = await chrome.storage.local.get(['user', 'authToken']);
        if (userData.user && userData.authToken) {
          const config = await fetchServerConfig(userData.user.id, userData.authToken);
          sendResponse({ success: true, config });
        } else {
          sendResponse({ success: false, error: 'User not logged in' });
        }
        break;
        
      case 'apiCall':
        const apiResult = await makeApiCall(message.endpoint, message.method, message.data);
        sendResponse(apiResult);
        break;
        
      case 'login':
        await handleLogin(message.credentials);
        sendResponse({ success: true });
        break;
        
      case 'logout':
        await handleLogout();
        sendResponse({ success: true });
        break;
        
      case 'updateBadge':
        if (message.text !== undefined) {
          chrome.action.setBadgeText({ text: message.text });
        }
        if (message.color) {
          chrome.action.setBadgeBackgroundColor({ color: message.color });
        }
        sendResponse({ success: true });
        break;
        
      case 'getUserInfo':
        const userInfo = await chrome.storage.local.get(['user', 'isLoggedIn']);
        sendResponse({ 
          success: true, 
          user: userInfo.user, 
          isLoggedIn: userInfo.isLoggedIn 
        });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Make API calls to server
async function makeApiCall(endpoint, method = 'GET', data = null) {
  try {
    const userData = await chrome.storage.local.get(['authToken']);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.authToken || ''}`
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return { success: true, data: result };
    
  } catch (error) {
    console.error('API call error:', error);
    return { success: false, error: error.message };
  }
}

// Handle user login
async function handleLogin(credentials) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
    
    const result = await response.json();
    
    // Store user data and token
    await chrome.storage.local.set({
      isLoggedIn: true,
      user: result.user,
      authToken: result.token
    });
    
    // Fetch initial config
    await fetchServerConfig(result.user.id, result.token);
    
    console.log('User logged in successfully');
    
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Handle user logout
async function handleLogout() {
  try {
    // Clear all user data
    await chrome.storage.local.clear();
    
    // Clear badge
    chrome.action.setBadgeText({ text: '' });
    
    console.log('User logged out successfully');
    
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

// Periodic config refresh (every 10 minutes)
setInterval(async () => {
  try {
    const result = await chrome.storage.local.get(['user', 'authToken', 'lastConfigFetch']);
    
    if (result.user && result.authToken) {
      // Check if it's been more than 10 minutes since last fetch
      if (!result.lastConfigFetch || Date.now() - result.lastConfigFetch > 10 * 60 * 1000) {
        await fetchServerConfig(result.user.id, result.authToken);
        console.log('Config refreshed automatically');
      }
    }
  } catch (error) {
    console.error('Error in periodic config refresh:', error);
  }
}, 10 * 60 * 1000); // 10 minutes

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup automatically
  console.log('Extension icon clicked');
});

// Error handling for unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in background script:', event.reason);
  event.preventDefault();
});
