// Minimal background script for Chrome extension
const chrome = window.chrome // Declare the chrome variable

class BackgroundService {
  constructor() {
    this.serverUrl = "https://your-domain.com/api/extension" // Updated API endpoint
    this.setupListeners()
    this.syncWithServer()
  }

  setupListeners() {
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true // Keep message channel open for async response
    })

    // Listen for extension installation
    chrome.runtime.onInstalled.addListener(() => {
      console.log("Phone Scraper Extension installed")
    })

    // Listen for auth completion from website
    chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
      if (message.type === "AUTH_SUCCESS" && message.token) {
        this.storeAuthData(message)
        sendResponse({ success: true })
      }
    })

    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === "config-sync") {
        port.onMessage.addListener(async (message) => {
          if (message.type === "CONFIG_UPDATE") {
            await this.handleConfigUpdate(message.config)
            port.postMessage({ success: true })
          }
        })
      }
    })
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case "PHONE_DATA":
          await this.sendPhoneData(message.data, sender.tab)
          sendResponse({ success: true })
          break

        case "GET_AUTH":
          const authData = await this.getStoredAuth()
          sendResponse({ authData })
          break

        case "SYNC_CONFIG":
          await this.syncWithServer()
          sendResponse({ success: true })
          break

        default:
          sendResponse({ error: "Unknown message type" })
      }
    } catch (error) {
      sendResponse({ error: error.message })
    }
  }

  async sendPhoneData(phoneData, tab) {
    try {
      const authData = await this.getStoredAuth()
      if (!authData || !authData.token) {
        throw new Error("No authentication token")
      }

      const response = await fetch(`${this.serverUrl}/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.token}`,
        },
        body: JSON.stringify({
          userId: authData.userId,
          data: phoneData.map((phone) => ({
            phone,
            source: tab.url,
            title: tab.title,
            timestamp: new Date().toISOString(),
          })),
          source: tab.url,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send data to server")
      }

      const result = await response.json()

      // Show success notification
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Phone Scraper",
        message: `Saved ${result.count} phone numbers to your dashboard`,
      })
    } catch (error) {
      console.error("Failed to send phone data:", error)
    }
  }

  async syncWithServer() {
    try {
      const authData = await this.getStoredAuth()
      if (!authData || !authData.token) return

      const response = await fetch(`${this.serverUrl}/config`, {
        headers: {
          Authorization: `Bearer ${authData.token}`,
        },
      })

      if (response.ok) {
        const config = await response.json()
        await this.storeConfig(config)
      }
    } catch (error) {
      console.error("Failed to sync with server:", error)
    }
  }

  async handleConfigUpdate(config) {
    await this.storeConfig(config)

    // Notify all extension components about config update
    chrome.runtime.sendMessage({
      type: "CONFIG_UPDATED",
      config: config,
    })
  }

  async storeConfig(config) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ extensionConfig: config }, resolve)
    })
  }

  async storeAuthData(authData) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ authData }, resolve)
    })
  }

  async getStoredAuth() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["authData"], (result) => {
        resolve(result.authData)
      })
    })
  }
}

// Initialize background service
new BackgroundService()

setInterval(() => {
  new BackgroundService().syncWithServer()
}, 300000) // Sync every 5 minutes
