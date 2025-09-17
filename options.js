// Options page functionality
class OptionsManager {
  constructor() {
    this.settings = {}
    this.authStatus = false
    this.chrome = window.chrome // Declare the chrome variable
    this.initialize()
  }

  async initialize() {
    await this.loadSettings()
    await this.checkAuthStatus()
    this.populateForm()
    this.setupEventListeners()
  }

  async loadSettings() {
    try {
      const result = await this.chrome.storage.local.get([
        "autoTabSwitch",
        "numberFormatting",
        "usOnly",
        "excludeTollFree",
        "nextTabDelayMs",
        "syncInterval",
        "notifications",
        "debugMode",
        "cacheDuration",
      ])

      // Set defaults for missing settings
      this.settings = {
        autoTabSwitch: result.autoTabSwitch !== false, // Default true
        numberFormatting: result.numberFormatting !== false, // Default true
        usOnly: result.usOnly === true, // Default false
        excludeTollFree: result.excludeTollFree === true, // Default false
        nextTabDelayMs: result.nextTabDelayMs || 500,
        syncInterval: result.syncInterval || 30,
        notifications: result.notifications !== false, // Default true
        debugMode: result.debugMode === true, // Default false
        cacheDuration: result.cacheDuration || 24,
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      this.showStatus("Error loading settings", "error")
    }
  }

  async checkAuthStatus() {
    try {
      const response = await this.chrome.runtime.sendMessage({ action: "getAuthStatus" })

      if (response.success) {
        this.authStatus = response.authenticated
        this.updateAuthDisplay()
      } else {
        this.authStatus = false
        this.updateAuthDisplay()
      }
    } catch (error) {
      console.error("Error checking auth status:", error)
      this.authStatus = false
      this.updateAuthDisplay()
    }
  }

  updateAuthDisplay() {
    const indicator = document.getElementById("auth-indicator")
    const statusText = document.getElementById("auth-status-text")
    const authButton = document.getElementById("auth-button")

    if (this.authStatus) {
      indicator.className = "status-indicator connected"
      statusText.textContent = "Connected to server"
      authButton.textContent = "Sign Out"
      authButton.onclick = () => this.handleSignOut()
    } else {
      indicator.className = "status-indicator disconnected"
      statusText.textContent = "Not authenticated"
      authButton.textContent = "Sign In"
      authButton.onclick = () => this.handleSignIn()
    }
  }

  populateForm() {
    // Populate form fields with current settings
    document.getElementById("autoTabSwitch").checked = this.settings.autoTabSwitch
    document.getElementById("numberFormatting").checked = this.settings.numberFormatting
    document.getElementById("usOnly").checked = this.settings.usOnly
    document.getElementById("excludeTollFree").checked = this.settings.excludeTollFree
    document.getElementById("nextTabDelayMs").value = this.settings.nextTabDelayMs
    document.getElementById("syncInterval").value = this.settings.syncInterval
    document.getElementById("notifications").checked = this.settings.notifications
    document.getElementById("debugMode").checked = this.settings.debugMode
    document.getElementById("cacheDuration").value = this.settings.cacheDuration
  }

  setupEventListeners() {
    // Add change listeners to form elements
    const formElements = [
      "autoTabSwitch",
      "numberFormatting",
      "usOnly",
      "excludeTollFree",
      "nextTabDelayMs",
      "syncInterval",
      "notifications",
      "debugMode",
      "cacheDuration",
    ]

    formElements.forEach((elementId) => {
      const element = document.getElementById(elementId)
      if (element) {
        element.addEventListener("change", () => {
          this.markAsChanged()
        })
      }
    })
  }

  markAsChanged() {
    const saveButton = document.getElementById("save-button")
    saveButton.textContent = "Save Changes"
    saveButton.style.background = "#f59e0b"
  }

  async saveSettings() {
    try {
      const saveButton = document.getElementById("save-button")
      saveButton.disabled = true
      saveButton.textContent = "Saving..."

      // Collect form data
      const newSettings = {
        autoTabSwitch: document.getElementById("autoTabSwitch").checked,
        numberFormatting: document.getElementById("numberFormatting").checked,
        usOnly: document.getElementById("usOnly").checked,
        excludeTollFree: document.getElementById("excludeTollFree").checked,
        nextTabDelayMs: Number.parseInt(document.getElementById("nextTabDelayMs").value),
        syncInterval: Number.parseInt(document.getElementById("syncInterval").value),
        notifications: document.getElementById("notifications").checked,
        debugMode: document.getElementById("debugMode").checked,
        cacheDuration: Number.parseInt(document.getElementById("cacheDuration").value),
      }

      // Validate settings
      if (newSettings.nextTabDelayMs < 0 || newSettings.nextTabDelayMs > 5000) {
        throw new Error("Tab switch delay must be between 0 and 5000 milliseconds")
      }

      // Save to storage
      await this.chrome.storage.local.set(newSettings)

      // Update background script settings
      await this.chrome.runtime.sendMessage({
        action: "updateSettings",
        settings: newSettings,
      })

      this.settings = newSettings
      this.showStatus("Settings saved successfully!", "success")

      saveButton.disabled = false
      saveButton.textContent = "Save Settings"
      saveButton.style.background = ""
    } catch (error) {
      console.error("Error saving settings:", error)
      this.showStatus(`Error saving settings: ${error.message}`, "error")

      const saveButton = document.getElementById("save-button")
      saveButton.disabled = false
      saveButton.textContent = "Save Settings"
      saveButton.style.background = ""
    }
  }

  async handleSignIn() {
    try {
      // Open auth page in new tab
      const authUrl = this.chrome.runtime.getURL("auth.html")
      await this.chrome.tabs.create({ url: authUrl })

      // Listen for auth completion
      const checkAuth = setInterval(async () => {
        await this.checkAuthStatus()
        if (this.authStatus) {
          clearInterval(checkAuth)
          this.showStatus("Successfully authenticated!", "success")
        }
      }, 2000)

      // Stop checking after 5 minutes
      setTimeout(() => {
        clearInterval(checkAuth)
      }, 300000)
    } catch (error) {
      console.error("Error during sign in:", error)
      this.showStatus("Error during sign in", "error")
    }
  }

  async handleSignOut() {
    try {
      if (window.supabaseAuth) {
        await window.supabaseAuth.signOut()
      } else {
        // Clear local auth data
        await this.chrome.storage.local.remove(["supabase_session"])
      }

      this.authStatus = false
      this.updateAuthDisplay()
      this.showStatus("Successfully signed out", "success")
    } catch (error) {
      console.error("Error during sign out:", error)
      this.showStatus("Error during sign out", "error")
    }
  }

  async resetExtension() {
    if (!confirm("Are you sure you want to reset the extension? This will clear all local data and settings.")) {
      return
    }

    try {
      // Clear all local storage
      await this.chrome.storage.local.clear()

      // Reset form to defaults
      await this.loadSettings()
      this.populateForm()

      // Update auth status
      this.authStatus = false
      this.updateAuthDisplay()

      this.showStatus("Extension reset successfully. Please refresh this page.", "success")
    } catch (error) {
      console.error("Error resetting extension:", error)
      this.showStatus("Error resetting extension", "error")
    }
  }

  showStatus(message, type) {
    const container = document.getElementById("status-container")
    container.innerHTML = `<div class="status-message ${type}">${message}</div>`

    // Auto-hide after 5 seconds
    setTimeout(() => {
      container.innerHTML = ""
    }, 5000)
  }
}

// Global functions for HTML onclick handlers
window.saveSettings = () => {
  window.optionsManager.saveSettings()
}

window.handleAuth = () => {
  if (window.optionsManager.authStatus) {
    window.optionsManager.handleSignOut()
  } else {
    window.optionsManager.handleSignIn()
  }
}

window.resetExtension = () => {
  window.optionsManager.resetExtension()
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.optionsManager = new OptionsManager()
})
