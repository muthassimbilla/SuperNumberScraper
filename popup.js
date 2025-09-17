class MinimalPopup {
  constructor() {
    this.serverUrl = "https://super-number-scraper.vercel.app/api"
    this.isAuthenticated = false
  }

  async initialize() {
    try {
      // Check authentication
      const session = await this.getStoredSession()
      if (!session || this.isSessionExpired(session)) {
        this.showAuthRequired()
        return
      }

      this.isAuthenticated = true
      await this.loadServerUI()
    } catch (error) {
      console.error("Error initializing:", error)
      this.showError("Failed to connect to server")
    }
  }

  async getStoredSession() {
    return new Promise((resolve) => {
      window.chrome.storage.local.get(["auth_session"], (result) => {
        resolve(result.auth_session)
      })
    })
  }

  isSessionExpired(session) {
    return Date.now() > session.expires_at * 1000
  }

  async loadServerUI() {
    try {
      const session = await this.getStoredSession()
      const response = await window.fetch(`${this.serverUrl}/ui-config`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error("Failed to load UI config")

      const uiConfig = await response.json()
      this.renderUI(uiConfig)
    } catch (error) {
      console.error("Error loading server UI:", error)
      this.showError("Failed to load interface")
    }
  }

  renderUI(config) {
    const container = document.getElementById("app-container")
    container.innerHTML = ""

    // Render header
    if (config.header) {
      const header = document.createElement("div")
      header.className = "header"
      header.innerHTML = `<h2>${config.header.title}</h2>`
      container.appendChild(header)
    }

    // Render features
    if (config.features) {
      config.features.forEach((feature) => {
        const featureEl = document.createElement("div")
        featureEl.className = "feature-card"
        featureEl.innerHTML = `
          <h3>${feature.title}</h3>
          <p>${feature.description}</p>
          <button onclick="window.handleFeature('${feature.id}')">${feature.buttonText}</button>
        `
        container.appendChild(featureEl)
      })
    }
  }

  showAuthRequired() {
    document.getElementById("app-container").innerHTML = `
      <div class="auth-required">
        <h3>Authentication Required</h3>
        <p>Please sign in to use this extension</p>
        <button onclick="window.openAuth()">Sign In</button>
      </div>
    `
  }

  showError(message) {
    document.getElementById("app-container").innerHTML = `
      <div class="error">
        <h3>Error</h3>
        <p>${message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `
  }
}

// Global functions
window.handleFeature = async (featureId) => {
  const session = await new MinimalPopup().getStoredSession()

  // Send feature request to server
  try {
    const response = await window.fetch(`https://your-domain.com/api/feature/${featureId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    })

    const result = await response.json()

    if (result.action === "scrape") {
      // Trigger content script
      window.chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        window.chrome.tabs.sendMessage(tabs[0].id, { action: "scrapeNumbers" })
      })
    }
  } catch (error) {
    console.error("Feature error:", error)
  }
}

window.openAuth = () => {
  window.chrome.tabs.create({ url: "https://your-domain.com/auth" })
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  new MinimalPopup().initialize()
})
