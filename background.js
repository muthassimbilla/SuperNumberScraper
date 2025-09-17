class MinimalBackground {
  constructor() {
    this.setupEventListeners()
  }

  setupEventListeners() {
    // Extension installation
    window.chrome.runtime.onInstalled.addListener(() => {
      console.log("Minimal extension installed")
    })

    // Handle messages from popup
    window.chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true
    })
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case "checkAuth":
          await this.checkAuthStatus(sendResponse)
          break
        case "openAuthTab":
          await this.openAuthTab(sendResponse)
          break
        default:
          sendResponse({ error: "Unknown action" })
      }
    } catch (error) {
      sendResponse({ error: error.message })
    }
  }

  async checkAuthStatus(sendResponse) {
    const session = await new Promise((resolve) => {
      window.chrome.storage.local.get(["auth_session"], (result) => {
        resolve(result.auth_session)
      })
    })

    const isAuthenticated = session && Date.now() < session.expires_at * 1000
    sendResponse({ authenticated: isAuthenticated, session })
  }

  async openAuthTab(sendResponse) {
    await window.chrome.tabs.create({
      url: "https://your-domain.com/auth",
    })
    sendResponse({ success: true })
  }
}

// Initialize
new MinimalBackground()
