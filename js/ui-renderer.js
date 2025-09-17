// UI Renderer for Server-Driven Interface
class UIRenderer {
  constructor() {
    this.currentFeature = null
    this.uiConfig = null
    this.userSubscription = null
    this.chrome = window.chrome // Declare the chrome variable
  }

  // Render the main UI based on server configuration
  async renderUI(config, subscription) {
    this.uiConfig = config
    this.userSubscription = subscription

    const featuresGrid = document.getElementById("features-grid")
    featuresGrid.innerHTML = ""

    if (!config.features || config.features.length === 0) {
      this.renderEmptyState()
      return
    }

    // Render feature cards
    config.features.forEach((feature) => {
      const featureCard = this.createFeatureCard(feature)
      featuresGrid.appendChild(featureCard)
    })

    // Apply theme
    this.applyTheme(config.theme || "light")
  }

  // Create a feature card element
  createFeatureCard(feature) {
    const card = document.createElement("div")
    card.className = "feature-card"
    card.dataset.feature = feature.name

    // Check if feature requires premium and user doesn't have it
    const isPremium = feature.premium === true
    const hasPremium = this.userSubscription?.subscription_status === "premium"
    const isDisabled = isPremium && !hasPremium

    if (isDisabled) {
      card.classList.add("disabled")
    }

    card.innerHTML = `
            ${this.getFeatureIcon(feature.icon || feature.type)}
            <h3 class="feature-title">${feature.title}</h3>
            <p class="feature-description">${this.getFeatureDescription(feature)}</p>
            ${isPremium ? '<div class="premium-badge">Premium</div>' : ""}
        `

    // Add click handler
    card.addEventListener("click", () => {
      if (isDisabled) {
        this.showPremiumRequired(feature)
        return
      }
      this.activateFeature(feature)
    })

    return card
  }

  // Get feature icon HTML
  getFeatureIcon(iconType) {
    const icons = {
      phone: `<svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>`,
      search: `<svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>`,
      bot: `<svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>`,
      download: `<svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>`,
      button: `<svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/>
            </svg>`,
    }

    return icons[iconType] || icons.button
  }

  // Get feature description
  getFeatureDescription(feature) {
    const descriptions = {
      phone_scraper: "Extract phone numbers from web pages",
      advanced_search: "Search with advanced filters and AI",
      ai_assistant: "Get help from AI assistant",
      export_data: "Export your data in various formats",
    }

    return feature.description || descriptions[feature.name] || "Feature functionality"
  }

  // Activate a feature
  async activateFeature(feature) {
    this.currentFeature = feature

    // Clear previous content
    const contentArea = document.getElementById("feature-content")
    contentArea.innerHTML = ""

    // Show loading
    contentArea.innerHTML = `
            <div class="feature-content">
                <div class="loading">
                    <div class="spinner"></div>
                    <span>Loading ${feature.title}...</span>
                </div>
            </div>
        `

    try {
      // Handle different feature types
      switch (feature.name) {
        case "phone_scraper":
          await this.renderPhoneScraperFeature(contentArea)
          break
        case "advanced_search":
          await this.renderAdvancedSearchFeature(contentArea)
          break
        case "ai_assistant":
          await this.renderAIAssistantFeature(contentArea)
          break
        case "export_data":
          await this.renderExportDataFeature(contentArea)
          break
        default:
          await this.renderGenericFeature(contentArea, feature)
      }
    } catch (error) {
      console.error("Error activating feature:", error)
      this.showError(`Failed to load ${feature.title}: ${error.message}`)
    }
  }

  // Render phone scraper feature
  async renderPhoneScraperFeature(container) {
    try {
      // Get current tab and scan for numbers
      const tabs = await this.chrome.tabs.query({ active: true, currentWindow: true })
      if (!tabs[0]?.id) {
        throw new Error("Cannot access current tab")
      }

      // Inject content script if needed and get numbers
      let response
      try {
        response = await this.chrome.tabs.sendMessage(tabs[0].id, { action: "getNumbers" })
      } catch (error) {
        // Try to inject content script
        await this.chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ["areacodes.js", "content.js"],
        })
        response = await this.chrome.tabs.sendMessage(tabs[0].id, { action: "getNumbers" })
      }

      if (!response || !response.numbers || response.numbers.length === 0) {
        container.innerHTML = `
                    <div class="feature-content">
                        <div class="empty-state">
                            <h3>No Phone Numbers Found</h3>
                            <p>No phone numbers were detected on the current page. Try navigating to a page with contact information.</p>
                        </div>
                    </div>
                `
        return
      }

      // Get saved numbers to filter duplicates
      const userData = await window.serverAPI.getUserData("phone_numbers")
      const savedNumbers = userData.map((item) => item.data.number)

      // Filter new numbers
      const newNumbers = response.numbers.filter((num) => {
        const normalized = this.normalizePhoneNumber(num)
        return !savedNumbers.includes(normalized)
      })

      container.innerHTML = `
                <div class="feature-content">
                    <h3>Phone Numbers Found (${newNumbers.length} new)</h3>
                    <div class="phone-numbers-list" id="phone-numbers-list">
                        ${
                          newNumbers.length === 0
                            ? '<div class="empty-state"><p>All numbers on this page are already saved</p></div>'
                            : newNumbers.map((number) => this.createPhoneNumberItem(number)).join("")
                        }
                    </div>
                </div>
            `

      // Add click handlers for phone numbers
      this.attachPhoneNumberHandlers()
    } catch (error) {
      console.error("Error rendering phone scraper:", error)
      container.innerHTML = `
                <div class="feature-content">
                    <div class="error-message">
                        Error loading phone scraper: ${error.message}
                    </div>
                </div>
            `
    }
  }

  // Create phone number item HTML
  createPhoneNumberItem(number) {
    const location = window.getLocationFromAreaCode ? window.getLocationFromAreaCode(number) : "Unknown Location"

    return `
            <div class="phone-number-item" data-number="${number}">
                <div class="number-info">
                    <div class="number-text">${number}</div>
                    <div class="number-location">${location || "Unknown Location"}</div>
                </div>
                <div class="copy-status" style="display: none;">Copied!</div>
            </div>
        `
  }

  // Attach click handlers to phone number items
  attachPhoneNumberHandlers() {
    const phoneItems = document.querySelectorAll(".phone-number-item")
    phoneItems.forEach((item) => {
      item.addEventListener("click", async () => {
        const number = item.dataset.number
        const copyStatus = item.querySelector(".copy-status")

        try {
          // Copy to clipboard
          await navigator.clipboard.writeText(number)

          // Show copied status
          item.classList.add("copied")
          copyStatus.style.display = "block"

          // Save to user data
          const saved = await window.serverAPI.saveUserData("phone_numbers", {
            number: this.normalizePhoneNumber(number),
            original_format: number,
            location: window.getLocationFromAreaCode ? window.getLocationFromAreaCode(number) : null,
            copied_at: new Date().toISOString(),
          })

          if (saved) {
            setTimeout(() => {
              copyStatus.textContent = "Saved!"
            }, 500)
          }
        } catch (error) {
          console.error("Error copying number:", error)
          copyStatus.textContent = "Error!"
          copyStatus.style.display = "block"
        }
      })
    })
  }

  // Render other features (placeholder implementations)
  async renderAdvancedSearchFeature(container) {
    container.innerHTML = `
            <div class="feature-content">
                <h3>Advanced Search</h3>
                <p>Advanced search functionality coming soon...</p>
            </div>
        `
  }

  async renderAIAssistantFeature(container) {
    container.innerHTML = `
            <div class="feature-content">
                <h3>AI Assistant</h3>
                <p>AI assistant functionality coming soon...</p>
            </div>
        `
  }

  async renderExportDataFeature(container) {
    container.innerHTML = `
            <div class="feature-content">
                <h3>Export Data</h3>
                <p>Data export functionality coming soon...</p>
            </div>
        `
  }

  async renderGenericFeature(container, feature) {
    container.innerHTML = `
            <div class="feature-content">
                <h3>${feature.title}</h3>
                <p>This feature is not yet implemented.</p>
            </div>
        `
  }

  // Show premium required message
  showPremiumRequired(feature) {
    this.showError(`${feature.title} requires a premium subscription. Please upgrade to access this feature.`)
  }

  // Show error message
  showError(message) {
    const errorContainer = document.getElementById("error-container")
    errorContainer.innerHTML = `
            <div class="error-message">
                ${message}
            </div>
        `

    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorContainer.innerHTML = ""
    }, 5000)
  }

  // Render empty state
  renderEmptyState() {
    const featuresGrid = document.getElementById("features-grid")
    featuresGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <h3>No Features Available</h3>
                <p>No features are currently configured for your account.</p>
            </div>
        `
  }

  // Apply theme
  applyTheme(theme) {
    document.body.className = theme === "dark" ? "dark-theme" : ""
  }

  // Utility function to normalize phone numbers
  normalizePhoneNumber(number) {
    let digits = number.replace(/\D/g, "")
    if (digits.length === 11 && digits.startsWith("1")) {
      digits = digits.substring(1)
    }
    return digits.length === 10 ? digits : number
  }
}

// Export for use in popup.js
window.UIRenderer = UIRenderer
