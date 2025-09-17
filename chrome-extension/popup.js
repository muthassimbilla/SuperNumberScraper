// Minimal popup script that connects to your server
class MinimalExtension {
  constructor() {
    this.serverUrl = "http://localhost:3000/api/extension" // For development
    this.dashboardUrl = "http://localhost:3000" // Dashboard URL
    this.container = document.getElementById("app-container")
    this.init()
  }

  async init() {
    try {
      // Check authentication status
      const authData = await this.getStoredAuth()

      if (!authData || !authData.token) {
        this.showAuthRequired()
        return
      }

      // Verify token with server
      const isValid = await this.verifyToken(authData.token)
      if (!isValid) {
        this.showAuthRequired()
        return
      }

      // Load UI configuration from web control panel
      await this.loadServerUI(authData.token)
    } catch (error) {
      this.showError("Failed to initialize extension: " + error.message)
    }
  }

  async getStoredAuth() {
    return new Promise((resolve) => {
      window.chrome.storage.local.get(["authData"], (result) => {
        resolve(result.authData)
      })
    })
  }

  async verifyToken(token) {
    try {
      const response = await fetch(`${this.serverUrl}/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  async loadServerUI(token) {
    try {
      const response = await fetch(`${this.serverUrl}/config`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to load UI configuration")
      }

      const config = await response.json()
      this.renderUI(config.ui, token)
    } catch (error) {
      this.showError("Failed to load UI: " + error.message)
    }
  }

  renderUI(uiConfig, token) {
    this.container.innerHTML = ""

    uiConfig.features?.forEach((feature) => {
      if (!feature.enabled) return // Skip disabled features

      const card = document.createElement("div")
      card.className = `feature-card ${feature.premium ? "premium" : "free"}`

      card.innerHTML = `
        <div class="feature-icon">${this.getIcon(feature.icon)}</div>
        <h3>${feature.title}</h3>
        <p>${feature.description}</p>
        <button onclick="window.extensionApp.executeFeature('${feature.id}', '${token}')" 
                ${feature.premium ? 'class="premium-button"' : ""}>
          ${feature.premium ? "⭐ " : ""}${feature.buttonText || "Execute"}
        </button>
      `

      this.container.appendChild(card)
    })

    // Add status indicator
    const statusDiv = document.createElement("div")
    statusDiv.className = "status-bar"
    statusDiv.innerHTML = `
      <span class="status-indicator online"></span>
      <span>Connected to server</span>
    `
    this.container.appendChild(statusDiv)
  }

  getIcon(iconName) {
    const icons = {
      phone: "📞",
      download: "⬇️",
      save: "💾",
      settings: "⚙️",
      data: "📊",
    }
    return icons[iconName] || "🔧"
  }

  async executeFeature(featureId, token) {
    try {
      console.log("[v0] Executing feature:", featureId)
      const response = await fetch(`${this.serverUrl}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ featureId }),
      })

      const result = await response.json()
      console.log("[v0] Feature execution result:", result)

      if (result.action === "scrape") {
        await this.triggerScraping(token)
      } else if (result.action === "redirect") {
        window.chrome.tabs.create({ url: result.url })
      } else if (result.action === "data-view") {
        window.chrome.tabs.create({ url: `${this.dashboardUrl}/dashboard?tab=data` })
      }
    } catch (error) {
      console.log("[v0] Feature execution error:", error)
      this.showError("Feature execution failed: " + error.message)
    }
  }

  async triggerScraping(token) {
    try {
      // Get current active tab
      const [tab] = await window.chrome.tabs.query({ active: true, currentWindow: true })

      // Inject and execute content script
      await window.chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // This will be handled by content.js
          window.postMessage({ type: "START_SCRAPING" }, "*")
        },
      })
    } catch (error) {
      this.showError("Scraping failed: " + error.message)
    }
  }

  showAuthRequired() {
    this.container.innerHTML = `
      <div class="auth-required">
        <h2>🔐 Authentication Required</h2>
        <p>Please sign in to your account to use this extension.</p>
        <button class="auth-button" onclick="window.extensionApp.openAuth()">
          Sign In to Dashboard
        </button>
        <div style="margin-top: 16px;">
          <button class="auth-button" onclick="window.extensionApp.testConnection()" style="background: #10b981;">
            Test Connection
          </button>
        </div>
      </div>
    `
  }

  openAuth() {
    console.log("[v0] Opening auth page:", `${this.dashboardUrl}/auth?extension=true`)
    window.chrome.tabs.create({ url: `${this.dashboardUrl}/auth?extension=true` })
  }

  async testConnection() {
    try {
      console.log("[v0] Testing connection to:", this.serverUrl)
      const response = await fetch(`${this.serverUrl}/config`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("[v0] Connection test response:", response.status)

      if (response.ok) {
        this.showError("✅ Connection successful! Please sign in through the dashboard.")
      } else {
        this.showError(`❌ Connection failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.log("[v0] Connection test error:", error)
      this.showError(`❌ Connection error: ${error.message}`)
    }
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="error">
        ${message}
      </div>
    `
  }
}

// Initialize extension when popup opens
window.extensionApp = new MinimalExtension()
