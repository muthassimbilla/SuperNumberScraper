// Smart Notes Extension - Popup Script
// Production-ready popup interface

console.log('Smart Notes Extension - Popup Script Loaded');

// Application State
let appState = {
  isLoggedIn: false,
  user: null,
  serverConfig: null,
  authToken: null,
  isFirstTime: false
};

// DOM Elements
let elements = {};

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup DOM loaded, initializing...');
  
  // Cache DOM elements
  cacheElements();
  
  // Setup event listeners
  setupEventListeners();
  
  // Initialize application
  await initializeApp();
});

// Cache DOM elements for better performance
function cacheElements() {
  elements = {
    loadingScreen: document.getElementById('loading-screen'),
    loginScreen: document.getElementById('login-screen'),
    appContainer: document.getElementById('app-container'),
    errorScreen: document.getElementById('error-screen'),
    welcomeScreen: document.getElementById('welcome-screen'),
    loginForm: document.getElementById('login-form'),
    loginError: document.getElementById('login-error'),
    loginBtn: document.getElementById('login-btn'),
    appTitle: document.getElementById('app-title'),
    refreshBtn: document.getElementById('refresh-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    dynamicContent: document.getElementById('dynamic-content'),
    userInfo: document.getElementById('user-info'),
    userBadge: document.getElementById('user-badge'),
    syncStatus: document.getElementById('sync-status'),
    retryBtn: document.getElementById('retry-btn'),
    offlineBtn: document.getElementById('offline-btn'),
    errorMessage: document.getElementById('error-message'),
    getStartedBtn: document.getElementById('get-started-btn'),
    learnMoreBtn: document.getElementById('learn-more-btn'),
    signupLink: document.getElementById('signup-link')
  };
}

// Setup event listeners
function setupEventListeners() {
  // Login form submission
  elements.loginForm?.addEventListener('submit', handleLogin);

  // Header buttons
  elements.refreshBtn?.addEventListener('click', handleRefresh);
  elements.settingsBtn?.addEventListener('click', handleSettings);
  elements.logoutBtn?.addEventListener('click', handleLogout);

  // Error screen buttons
  elements.retryBtn?.addEventListener('click', handleRetry);
  elements.offlineBtn?.addEventListener('click', handleOffline);

  // Welcome screen buttons
  elements.getStartedBtn?.addEventListener('click', handleGetStarted);
  elements.learnMoreBtn?.addEventListener('click', handleLearnMore);
  elements.signupLink?.addEventListener('click', handleSignup);

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Initialize the application
async function initializeApp() {
  try {
    showScreen('loading');

    // Check if this is first time user
    const installData = await chrome.storage.local.get(['installDate', 'isFirstTime']);
    if (installData.installDate && !installData.isFirstTime) {
      appState.isFirstTime = true;
      await chrome.storage.local.set({ isFirstTime: true });
    }

    // Check authentication status
    const authStatus = await checkAuthStatus();

    if (!authStatus.isLoggedIn) {
      if (appState.isFirstTime) {
        showScreen('welcome');
      } else {
        showScreen('login');
      }
      return;
    }

    // Update app state
    appState = {
      isLoggedIn: true,
      user: authStatus.user,
      authToken: authStatus.authToken,
      serverConfig: null
    };

    // Fetch server configuration
    const configResult = await fetchServerConfig();

    if (!configResult.success) {
      showError('Failed to load configuration');
      return;
    }

    appState.serverConfig = configResult.config;

    // Render application with server config
    await renderApp();

  } catch (error) {
    console.error('Error initializing app:', error);
    showError(`Initialization failed: ${error.message}`);
  }
}

// Check authentication status from storage
async function checkAuthStatus() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['isLoggedIn', 'user', 'authToken'], (result) => {
      resolve({
        isLoggedIn: result.isLoggedIn || false,
        user: result.user || null,
        authToken: result.authToken || null
      });
    });
  });
}

// Fetch server configuration
async function fetchServerConfig() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getServerConfig' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response);
      }
    });
  });
}

// Handle login form submission
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showLoginError('Please enter both email and password');
    return;
  }

  // Validate email format
  if (!isValidEmail(email)) {
    showLoginError('Please enter a valid email address');
    return;
  }

  // Show loading state
  setLoginLoading(true);

  try {
    // Send login request to background script
    const result = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'login',
        credentials: { email, password }
      }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response);
        }
      });
    });

    if (result.success) {
      // Login successful, reinitialize app
      await initializeApp();
    } else {
      showLoginError(result.error || 'Login failed. Please check your credentials.');
    }

  } catch (error) {
    console.error('Login error:', error);
    showLoginError('Login failed. Please try again.');
  } finally {
    setLoginLoading(false);
  }
}

// Handle refresh button click
async function handleRefresh() {
  elements.refreshBtn.innerHTML = '<span>⏳</span>';
  elements.refreshBtn.disabled = true;

  try {
    const result = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'refreshConfig' }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response);
        }
      });
    });

    if (result.success) {
      appState.serverConfig = result.config;
      await renderApp();
      updateSyncStatus('Refreshed');
      showNotification('Configuration updated successfully!', 'success');
    } else {
      showError(result.error || 'Failed to refresh configuration');
    }

  } catch (error) {
    console.error('Refresh error:', error);
    showError('Failed to refresh configuration');
  } finally {
    elements.refreshBtn.innerHTML = '<span>🔄</span>';
    elements.refreshBtn.disabled = false;
  }
}

// Handle settings button click
function handleSettings() {
  // Open settings page in new tab
  chrome.tabs.create({ url: 'https://your-website.com/settings' });
}

// Handle logout button click
async function handleLogout() {
  if (!confirm('Are you sure you want to sign out?')) return;

  try {
    const result = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'logout' }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response);
        }
      });
    });

    if (result.success) {
      // Reset app state
      appState = {
        isLoggedIn: false,
        user: null,
        serverConfig: null,
        authToken: null,
        isFirstTime: false
      };

      // Show login screen
      showScreen('login');

      // Clear any error messages
      hideLoginError();
      showNotification('Signed out successfully', 'info');
    }

  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Handle retry button click
async function handleRetry() {
  await initializeApp();
}

// Handle offline mode
function handleOffline() {
  showScreen('login');
  showNotification('Working in offline mode', 'warning');
}

// Handle welcome screen actions
function handleGetStarted() {
  showScreen('login');
}

function handleLearnMore() {
  chrome.tabs.create({ url: 'https://your-website.com/features' });
}

function handleSignup(event) {
  event.preventDefault();
  chrome.tabs.create({ url: 'https://your-website.com/signup' });
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(event) {
  // Ctrl/Cmd + R: Refresh
  if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
    event.preventDefault();
    if (appState.isLoggedIn) {
      handleRefresh();
    }
  }
  
  // Escape: Close popup
  if (event.key === 'Escape') {
    window.close();
  }
}

// Render the main application
async function renderApp() {
  if (!appState.serverConfig) {
    showError('No configuration available');
    return;
  }

  const config = appState.serverConfig;

  // Update app title
  elements.appTitle.textContent = config.title || 'Smart Notes';

  // Update user info and badge
  elements.userInfo.textContent = appState.user?.email || 'User';
  elements.userBadge.textContent = appState.user?.subscription === 'premium' ? 'PRO' : 'FREE';

  // Apply theme
  if (config.theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }

  // Render dynamic content based on config
  await renderDynamicContent(config);

  // Show app container
  showScreen('app');

  updateSyncStatus('Synced');
}

// Render dynamic content based on server configuration
async function renderDynamicContent(config) {
  if (!config.features || !Array.isArray(config.features)) {
    elements.dynamicContent.innerHTML = `
      <div class="no-features">
        <div class="no-features-icon">📝</div>
        <h4>No features available</h4>
        <p>Check back later for new features!</p>
      </div>
    `;
    return;
  }

  let contentHTML = '';

  config.features.forEach(feature => {
    contentHTML += renderFeature(feature);
  });

  elements.dynamicContent.innerHTML = contentHTML;

  // Add event listeners to feature elements
  setupFeatureEventListeners(config.features);
}

// Render individual feature
function renderFeature(feature) {
  const isPremium = feature.premium || false;
  const isEnabled = !isPremium || (appState.user && appState.user.subscription === 'premium');

  let featureContent = '';

  switch (feature.type) {
    case 'button':
      featureContent = `
        <button class="feature-button"
                data-feature="${feature.name}"
                ${!isEnabled ? 'disabled' : ''}>
          <span class="feature-icon">${feature.icon || '🔧'}</span>
          <span class="feature-text">${feature.label || feature.name}</span>
        </button>
      `;
      break;

    case 'editor':
      featureContent = `
        <div class="editor-container">
          <textarea class="feature-textarea"
                    data-feature="${feature.name}"
                    placeholder="${feature.placeholder || 'Enter text here...'}"
                    ${!isEnabled ? 'disabled' : ''}></textarea>
          <button class="feature-button mt-1"
                  data-feature="${feature.name}"
                  data-action="process"
                  ${!isEnabled ? 'disabled' : ''}>
            <span class="feature-icon">💾</span>
            <span class="feature-text">${feature.buttonLabel || 'Save'}</span>
          </button>
        </div>
      `;
      break;

    case 'display':
      featureContent = `
        <div class="feature-display" data-feature="${feature.name}">
          <div class="display-content">
            ${feature.content || 'No content available'}
          </div>
        </div>
      `;
      break;

    default:
      featureContent = `<p class="unknown-feature">Unknown feature type: ${feature.type}</p>`;
  }

  return `
    <div class="feature-container fade-in">
      <div class="feature-header">
        <div class="feature-title-section">
          <span class="feature-title">${feature.title || feature.name}</span>
          ${isPremium ? '<span class="premium-badge">PREMIUM</span>' : ''}
        </div>
        <div class="feature-status">
          ${isEnabled ? '<span class="status-enabled">✓</span>' : '<span class="status-disabled">✗</span>'}
        </div>
      </div>
      <div class="feature-content">
        ${featureContent}
        ${feature.description ? `<p class="feature-description">${feature.description}</p>` : ''}
      </div>
    </div>
  `;
}

// Setup event listeners for feature elements
function setupFeatureEventListeners(features) {
  // Button click handlers
  document.querySelectorAll('.feature-button').forEach(button => {
    button.addEventListener('click', handleFeatureAction);
  });

  // Textarea keydown handlers
  document.querySelectorAll('.feature-textarea').forEach(textarea => {
    textarea.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        const featureName = textarea.dataset.feature;
        handleFeatureAction({ target: { dataset: { feature: featureName, action: 'process' } } });
      }
    });
  });
}

// Handle feature actions
async function handleFeatureAction(event) {
  const button = event.target;
  const featureName = button.dataset.feature;
  const action = button.dataset.action || 'execute';

  if (!featureName) return;

  // Disable button during processing
  const originalContent = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="feature-icon">⏳</span><span class="feature-text">Processing...</span>';

  try {
    let inputData = null;

    // Get input data if it's an editor feature
    if (action === 'process') {
      const textarea = document.querySelector(`textarea[data-feature="${featureName}"]`);
      inputData = textarea ? textarea.value : null;
    }

    // Make API call to server
    const result = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'apiCall',
        endpoint: '/run-feature',
        method: 'POST',
        data: {
          user_id: appState.user.id,
          feature: featureName,
          action: action,
          input: inputData
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response);
        }
      });
    });

    if (result.success) {
      // Handle successful feature execution
      handleFeatureResult(featureName, result.data);

      // Show success feedback
      button.classList.add('pulse');
      setTimeout(() => button.classList.remove('pulse'), 600);
      
      showNotification('Feature executed successfully!', 'success');

    } else {
      // Show error
      console.error('Feature execution failed:', result.error);
      showNotification(`Feature failed: ${result.error}`, 'error');
    }

  } catch (error) {
    console.error('Feature action error:', error);
    showNotification('Feature execution failed. Please try again.', 'error');
  } finally {
    // Re-enable button
    button.disabled = false;
    button.innerHTML = originalContent;
  }
}

// Handle feature execution results
function handleFeatureResult(featureName, result) {
  console.log(`Feature ${featureName} result:`, result);

  // Find display element for this feature
  const displayElement = document.querySelector(`[data-feature="${featureName}"] .feature-display`);

  if (displayElement && result.output) {
    displayElement.innerHTML = `<div class="display-content">${result.output}</div>`;
  }

  // Handle specific result types
  if (result.type === 'download' && result.url) {
    // Trigger download
    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.filename || 'download';
    link.click();
  }

  if (result.type === 'clipboard' && result.text) {
    // Copy to clipboard
    navigator.clipboard.writeText(result.text).then(() => {
      showNotification('Copied to clipboard!', 'success');
    });
  }
}

// Utility Functions

// Show specific screen
function showScreen(screenName) {
  // Hide all screens
  elements.loadingScreen.style.display = 'none';
  elements.loginScreen.style.display = 'none';
  elements.appContainer.style.display = 'none';
  elements.errorScreen.style.display = 'none';
  elements.welcomeScreen.style.display = 'none';

  // Show requested screen
  switch (screenName) {
    case 'loading':
      elements.loadingScreen.style.display = 'flex';
      break;
    case 'login':
      elements.loginScreen.style.display = 'block';
      break;
    case 'app':
      elements.appContainer.style.display = 'flex';
      break;
    case 'error':
      elements.errorScreen.style.display = 'flex';
      break;
    case 'welcome':
      elements.welcomeScreen.style.display = 'flex';
      break;
  }
}

// Show error screen with message
function showError(message) {
  elements.errorMessage.textContent = message;
  showScreen('error');
}

// Show login error
function showLoginError(message) {
  elements.loginError.textContent = message;
  elements.loginError.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideLoginError();
  }, 5000);
}

// Hide login error
function hideLoginError() {
  elements.loginError.style.display = 'none';
  elements.loginError.textContent = '';
}

// Set login loading state
function setLoginLoading(loading) {
  const btnText = elements.loginBtn.querySelector('.btn-text');
  const btnLoading = elements.loginBtn.querySelector('.btn-loading');
  
  if (loading) {
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    elements.loginBtn.disabled = true;
  } else {
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    elements.loginBtn.disabled = false;
  }
}

// Update sync status
function updateSyncStatus(status) {
  const syncText = elements.syncStatus.querySelector('.sync-text');
  const syncIcon = elements.syncStatus.querySelector('.sync-icon');
  
  syncText.textContent = status;
  
  if (status === 'Synced') {
    syncIcon.textContent = '🟢';
  } else if (status === 'Refreshed') {
    syncIcon.textContent = '🔄';
  } else {
    syncIcon.textContent = '🟡';
  }

  // Reset to "Synced" after 3 seconds
  if (status !== 'Synced') {
    setTimeout(() => {
      updateSyncStatus('Synced');
    }, 3000);
  }
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  showNotification('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showNotification('An unexpected error occurred', 'error');
});