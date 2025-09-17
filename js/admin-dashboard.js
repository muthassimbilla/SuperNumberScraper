// Admin Dashboard Management System
class AdminDashboard {
  constructor() {
    this.currentTab = "overview"
    this.currentPage = 1
    this.pageSize = 20
    this.searchQuery = ""
    this.filterBy = "all"
    this.isAdmin = false
    this.chrome = window.chrome // Declare chrome variable
  }

  async initialize() {
    try {
      // Initialize authentication
      const user = await window.supabaseAuth.initialize()

      if (!user) {
        this.showAuthRequired()
        return
      }

      // Check admin privileges
      const isAdmin = await this.checkAdminPrivileges(user)

      if (!isAdmin) {
        this.showAuthRequired()
        return
      }

      this.isAdmin = true
      this.showDashboard(user)
      await this.loadTabContent("overview")
    } catch (error) {
      console.error("Error initializing admin dashboard:", error)
      this.showError("Failed to initialize dashboard. Please try again.")
    } finally {
      this.hideLoading()
    }
  }

  async checkAdminPrivileges(user) {
    try {
      const response = await fetch(
        `${window.supabaseAuth.constructor.SUPABASE_URL}/rest/v1/admin_roles?auth_id=eq.${user.id}`,
        {
          method: "GET",
          headers: {
            apikey: window.supabaseAuth.constructor.SUPABASE_KEY,
            Authorization: `Bearer ${window.supabaseAuth.session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.length > 0
    } catch (error) {
      console.error("Error checking admin privileges:", error)
      return false
    }
  }

  showAuthRequired() {
    document.getElementById("loading-state").style.display = "none"
    document.getElementById("auth-required").style.display = "block"
    document.getElementById("admin-dashboard").style.display = "none"
  }

  showDashboard(user) {
    document.getElementById("loading-state").style.display = "none"
    document.getElementById("auth-required").style.display = "none"
    document.getElementById("admin-dashboard").style.display = "block"

    document.getElementById("admin-email").textContent = user.email
  }

  hideLoading() {
    document.getElementById("loading-state").style.display = "none"
  }

  async switchTab(tabName) {
    this.currentTab = tabName

    // Update active tab
    document.querySelectorAll(".nav-tab").forEach((tab) => tab.classList.remove("active"))
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add("active")

    // Load tab content
    await this.loadTabContent(tabName)
  }

  async loadTabContent(tabName) {
    const container = document.getElementById("tab-content")
    container.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading...</span></div>'

    try {
      switch (tabName) {
        case "overview":
          await this.renderOverviewTab(container)
          break
        case "users":
          await this.renderUsersTab(container)
          break
        case "ui-config":
          await this.renderUIConfigTab(container)
          break
        case "data":
          await this.renderDataTab(container)
          break
        case "settings":
          await this.renderSettingsTab(container)
          break
        default:
          container.innerHTML = '<div class="empty-state"><h3>Tab not found</h3></div>'
      }
    } catch (error) {
      console.error(`Error loading ${tabName} tab:`, error)
      container.innerHTML = `<div class="error-message">Error loading ${tabName}: ${error.message}</div>`
    }
  }

  async renderOverviewTab(container) {
    // Get overview statistics
    const stats = await this.getOverviewStats()

    container.innerHTML = `
            <h2>Dashboard Overview</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Users</h3>
                    <div class="stat-value">${stats.totalUsers}</div>
                    <div class="stat-change">+${stats.newUsersToday} today</div>
                </div>
                <div class="stat-card">
                    <h3>Premium Users</h3>
                    <div class="stat-value">${stats.premiumUsers}</div>
                    <div class="stat-change">${Math.round((stats.premiumUsers / stats.totalUsers) * 100)}% of total</div>
                </div>
                <div class="stat-card">
                    <h3>Total Data Records</h3>
                    <div class="stat-value">${stats.totalDataRecords}</div>
                    <div class="stat-change">+${stats.newRecordsToday} today</div>
                </div>
                <div class="stat-card">
                    <h3>Active Features</h3>
                    <div class="stat-value">${stats.activeFeatures}</div>
                    <div class="stat-change">UI Config v${stats.currentUIVersion}</div>
                </div>
            </div>

            <div style="margin-top: 32px;">
                <h3>Recent Activity</h3>
                <div class="data-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Action</th>
                                <th>Feature</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.recentActivity
                              .map(
                                (activity) => `
                                <tr>
                                    <td>${activity.user_email}</td>
                                    <td>${activity.action}</td>
                                    <td>${activity.feature || "N/A"}</td>
                                    <td>${this.formatDate(activity.created_at)}</td>
                                </tr>
                            `,
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `
  }

  async renderUsersTab(container) {
    const users = await this.getUsers()

    container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2>User Management</h2>
                <button class="action-btn primary" onclick="adminDashboard.createUser()">Add User</button>
            </div>

            <div class="search-bar">
                <input type="text" class="search-input" placeholder="Search users..." 
                       value="${this.searchQuery}" onkeyup="adminDashboard.setSearchQuery(this.value)">
                <select class="filter-select" onchange="adminDashboard.setFilter(this.value)">
                    <option value="all" ${this.filterBy === "all" ? "selected" : ""}>All Users</option>
                    <option value="free" ${this.filterBy === "free" ? "selected" : ""}>Free Users</option>
                    <option value="premium" ${this.filterBy === "premium" ? "selected" : ""}>Premium Users</option>
                </select>
            </div>

            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Subscription</th>
                            <th>Expiry Date</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users
                          .map(
                            (user) => `
                            <tr>
                                <td>${user.email}</td>
                                <td><span class="status-badge ${user.subscription_status}">${user.subscription_status}</span></td>
                                <td>${user.expiry_date ? this.formatDate(user.expiry_date) : "N/A"}</td>
                                <td>${this.formatDate(user.created_at)}</td>
                                <td>
                                    <button class="action-btn" onclick="adminDashboard.editUser('${user.auth_id}')">Edit</button>
                                    <button class="action-btn danger" onclick="adminDashboard.deleteUser('${user.auth_id}')">Delete</button>
                                </td>
                            </tr>
                        `,
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>

            ${this.renderPagination()}
        `
  }

  async renderUIConfigTab(container) {
    const configs = await this.getUIConfigs()

    container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2>UI Configuration</h2>
                <button class="action-btn primary" onclick="adminDashboard.createUIConfig()">New Configuration</button>
            </div>

            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Version</th>
                            <th>Layout</th>
                            <th>Theme</th>
                            <th>Features</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${configs
                          .map(
                            (config) => `
                            <tr>
                                <td>v${config.version}</td>
                                <td>${config.layout}</td>
                                <td>${config.theme}</td>
                                <td>${config.features ? config.features.length : 0} features</td>
                                <td><span class="status-badge ${config.is_active ? "premium" : "free"}">${config.is_active ? "Active" : "Inactive"}</span></td>
                                <td>${this.formatDate(config.created_at)}</td>
                                <td>
                                    <button class="action-btn" onclick="adminDashboard.editUIConfig('${config.id}')">Edit</button>
                                    ${
                                      !config.is_active
                                        ? `<button class="action-btn primary" onclick="adminDashboard.activateUIConfig('${config.id}')">Activate</button>`
                                        : ""
                                    }
                                    <button class="action-btn danger" onclick="adminDashboard.deleteUIConfig('${config.id}')">Delete</button>
                                </td>
                            </tr>
                        `,
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        `
  }

  async renderDataTab(container) {
    const dataStats = await this.getUserDataStats()

    container.innerHTML = `
            <h2>User Data Overview</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Records</h3>
                    <div class="stat-value">${dataStats.totalRecords}</div>
                </div>
                <div class="stat-card">
                    <h3>Active Users</h3>
                    <div class="stat-value">${dataStats.activeUsers}</div>
                </div>
                <div class="stat-card">
                    <h3>Features Used</h3>
                    <div class="stat-value">${dataStats.featuresUsed}</div>
                </div>
                <div class="stat-card">
                    <h3>Avg Records/User</h3>
                    <div class="stat-value">${Math.round(dataStats.avgRecordsPerUser)}</div>
                </div>
            </div>

            <div style="margin-top: 32px;">
                <h3>Data by Feature</h3>
                <div class="data-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Feature</th>
                                <th>Total Records</th>
                                <th>Unique Users</th>
                                <th>Avg per User</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(dataStats.byFeature)
                              .map(
                                ([feature, stats]) => `
                                <tr>
                                    <td>${feature}</td>
                                    <td>${stats.count}</td>
                                    <td>${stats.users}</td>
                                    <td>${Math.round(stats.count / stats.users)}</td>
                                </tr>
                            `,
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `
  }

  async renderSettingsTab(container) {
    container.innerHTML = `
            <h2>System Settings</h2>
            
            <div style="max-width: 600px;">
                <div class="form-group">
                    <label>Default Subscription Status</label>
                    <select id="default-subscription">
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Auto-activate New UI Configs</label>
                    <select id="auto-activate-ui">
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Data Retention Period (days)</label>
                    <input type="number" id="data-retention" value="365" min="1">
                </div>

                <div class="form-group">
                    <label>Max Records per User</label>
                    <input type="number" id="max-records" value="10000" min="100">
                </div>

                <button class="action-btn primary" onclick="adminDashboard.saveSettings()">Save Settings</button>
            </div>

            <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <h3>System Actions</h3>
                <div style="display: flex; gap: 12px; margin-top: 16px;">
                    <button class="action-btn" onclick="adminDashboard.exportAllData()">Export All Data</button>
                    <button class="action-btn" onclick="adminDashboard.cleanupOldData()">Cleanup Old Data</button>
                    <button class="action-btn danger" onclick="adminDashboard.resetSystem()">Reset System</button>
                </div>
            </div>
        `
  }

  // Data fetching methods
  async getOverviewStats() {
    try {
      // This would typically make multiple API calls to get various statistics
      // For now, returning mock data
      return {
        totalUsers: 150,
        newUsersToday: 5,
        premiumUsers: 45,
        totalDataRecords: 2500,
        newRecordsToday: 120,
        activeFeatures: 4,
        currentUIVersion: 1,
        recentActivity: [
          {
            user_email: "user1@example.com",
            action: "Data Saved",
            feature: "phone_scraper",
            created_at: new Date().toISOString(),
          },
          {
            user_email: "user2@example.com",
            action: "Login",
            feature: null,
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
      }
    } catch (error) {
      console.error("Error getting overview stats:", error)
      return {
        totalUsers: 0,
        newUsersToday: 0,
        premiumUsers: 0,
        totalDataRecords: 0,
        newRecordsToday: 0,
        activeFeatures: 0,
        currentUIVersion: 1,
        recentActivity: [],
      }
    }
  }

  async getUsers() {
    try {
      const response = await fetch(
        `${window.supabaseAuth.constructor.SUPABASE_URL}/rest/v1/users?order=created_at.desc`,
        {
          method: "GET",
          headers: {
            apikey: window.supabaseAuth.constructor.SUPABASE_KEY,
            Authorization: `Bearer ${window.supabaseAuth.session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      return await response.json()
    } catch (error) {
      console.error("Error getting users:", error)
      return []
    }
  }

  async getUIConfigs() {
    try {
      const response = await fetch(
        `${window.supabaseAuth.constructor.SUPABASE_URL}/rest/v1/ui_config?order=version.desc`,
        {
          method: "GET",
          headers: {
            apikey: window.supabaseAuth.constructor.SUPABASE_KEY,
            Authorization: `Bearer ${window.supabaseAuth.session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch UI configs")
      }

      return await response.json()
    } catch (error) {
      console.error("Error getting UI configs:", error)
      return []
    }
  }

  async getUserDataStats() {
    try {
      // This would make API calls to get user data statistics
      // For now, returning mock data
      return {
        totalRecords: 2500,
        activeUsers: 120,
        featuresUsed: 4,
        avgRecordsPerUser: 20.8,
        byFeature: {
          phone_scraper: { count: 1800, users: 95 },
          advanced_search: { count: 450, users: 30 },
          ai_assistant: { count: 200, users: 15 },
          export_data: { count: 50, users: 10 },
        },
      }
    } catch (error) {
      console.error("Error getting user data stats:", error)
      return {
        totalRecords: 0,
        activeUsers: 0,
        featuresUsed: 0,
        avgRecordsPerUser: 0,
        byFeature: {},
      }
    }
  }

  // User management methods
  async editUser(userId) {
    try {
      // Get user data
      const response = await fetch(
        `${window.supabaseAuth.constructor.SUPABASE_URL}/rest/v1/users?auth_id=eq.${userId}`,
        {
          method: "GET",
          headers: {
            apikey: window.supabaseAuth.constructor.SUPABASE_KEY,
            Authorization: `Bearer ${window.supabaseAuth.session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch user")
      }

      const users = await response.json()
      const user = users[0]

      if (!user) {
        throw new Error("User not found")
      }

      // Populate modal
      document.getElementById("user-email").value = user.email
      document.getElementById("user-subscription").value = user.subscription_status
      document.getElementById("user-expiry").value = user.expiry_date
        ? new Date(user.expiry_date).toISOString().slice(0, 16)
        : ""

      // Show modal
      this.showModal("user-modal")

      // Handle form submission
      document.getElementById("user-form").onsubmit = async (e) => {
        e.preventDefault()
        await this.updateUser(userId)
      }
    } catch (error) {
      console.error("Error editing user:", error)
      this.showError("Failed to load user data")
    }
  }

  async updateUser(userId) {
    try {
      const subscription = document.getElementById("user-subscription").value
      const expiry = document.getElementById("user-expiry").value

      const response = await fetch(
        `${window.supabaseAuth.constructor.SUPABASE_URL}/rest/v1/users?auth_id=eq.${userId}`,
        {
          method: "PATCH",
          headers: {
            apikey: window.supabaseAuth.constructor.SUPABASE_KEY,
            Authorization: `Bearer ${window.supabaseAuth.session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription_status: subscription,
            expiry_date: expiry || null,
            updated_at: new Date().toISOString(),
          }),
        },
      )

      if (!response.ok) {
        throw new Error("Failed to update user")
      }

      this.closeModal("user-modal")
      this.showSuccess("User updated successfully")
      await this.loadTabContent("users")
    } catch (error) {
      console.error("Error updating user:", error)
      this.showError("Failed to update user")
    }
  }

  async deleteUser(userId) {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(
        `${window.supabaseAuth.constructor.SUPABASE_URL}/rest/v1/users?auth_id=eq.${userId}`,
        {
          method: "DELETE",
          headers: {
            apikey: window.supabaseAuth.constructor.SUPABASE_KEY,
            Authorization: `Bearer ${window.supabaseAuth.session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      this.showSuccess("User deleted successfully")
      await this.loadTabContent("users")
    } catch (error) {
      console.error("Error deleting user:", error)
      this.showError("Failed to delete user")
    }
  }

  // UI Config management methods
  async editUIConfig(configId) {
    try {
      // Get config data
      const response = await fetch(
        `${window.supabaseAuth.constructor.SUPABASE_URL}/rest/v1/ui_config?id=eq.${configId}`,
        {
          method: "GET",
          headers: {
            apikey: window.supabaseAuth.constructor.SUPABASE_KEY,
            Authorization: `Bearer ${window.supabaseAuth.session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch UI config")
      }

      const configs = await response.json()
      const config = configs[0]

      if (!config) {
        throw new Error("UI config not found")
      }

      // Populate modal
      document.getElementById("config-version").value = config.version
      document.getElementById("config-layout").value = config.layout
      document.getElementById("config-theme").value = config.theme
      document.getElementById("config-features").value = JSON.stringify(config.features, null, 2)

      // Show modal
      this.showModal("ui-config-modal")

      // Handle form submission
      document.getElementById("ui-config-form").onsubmit = async (e) => {
        e.preventDefault()
        await this.updateUIConfig(configId)
      }
    } catch (error) {
      console.error("Error editing UI config:", error)
      this.showError("Failed to load UI config")
    }
  }

  async updateUIConfig(configId) {
    try {
      const version = Number.parseInt(document.getElementById("config-version").value)
      const layout = document.getElementById("config-layout").value
      const theme = document.getElementById("config-theme").value
      const featuresText = document.getElementById("config-features").value

      let features
      try {
        features = JSON.parse(featuresText)
      } catch (error) {
        throw new Error("Invalid JSON in features field")
      }

      const response = await fetch(
        `${window.supabaseAuth.constructor.SUPABASE_URL}/rest/v1/ui_config?id=eq.${configId}`,
        {
          method: "PATCH",
          headers: {
            apikey: window.supabaseAuth.constructor.SUPABASE_KEY,
            Authorization: `Bearer ${window.supabaseAuth.session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            version: version,
            layout: layout,
            theme: theme,
            features: features,
            updated_at: new Date().toISOString(),
          }),
        },
      )

      if (!response.ok) {
        throw new Error("Failed to update UI config")
      }

      this.closeModal("ui-config-modal")
      this.showSuccess("UI configuration updated successfully")
      await this.loadTabContent("ui-config")
    } catch (error) {
      console.error("Error updating UI config:", error)
      this.showError("Failed to update UI config: " + error.message)
    }
  }

  async activateUIConfig(configId) {
    try {
      // First, deactivate all configs
      await fetch(`${window.supabaseAuth.constructor.SUPABASE_URL}/rest/v1/ui_config`, {
        method: "PATCH",
        headers: {
          apikey: window.supabaseAuth.constructor.SUPABASE_KEY,
          Authorization: `Bearer ${window.supabaseAuth.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: false,
        }),
      })

      // Then activate the selected config
      const response = await fetch(
        `${window.supabaseAuth.constructor.SUPABASE_URL}/rest/v1/ui_config?id=eq.${configId}`,
        {
          method: "PATCH",
          headers: {
            apikey: window.supabaseAuth.constructor.SUPABASE_KEY,
            Authorization: `Bearer ${window.supabaseAuth.session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: true,
            updated_at: new Date().toISOString(),
          }),
        },
      )

      if (!response.ok) {
        throw new Error("Failed to activate UI config")
      }

      this.showSuccess("UI configuration activated successfully")
      await this.loadTabContent("ui-config")
    } catch (error) {
      console.error("Error activating UI config:", error)
      this.showError("Failed to activate UI config")
    }
  }

  // Utility methods
  showModal(modalId) {
    document.getElementById(modalId).classList.add("active")
  }

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove("active")
  }

  showError(message) {
    const container = document.getElementById("message-container")
    container.innerHTML = `<div class="error-message">${message}</div>`
    setTimeout(() => {
      container.innerHTML = ""
    }, 5000)
  }

  showSuccess(message) {
    const container = document.getElementById("message-container")
    container.innerHTML = `<div class="success-message">${message}</div>`
    setTimeout(() => {
      container.innerHTML = ""
    }, 5000)
  }

  formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  renderPagination() {
    // Simple pagination placeholder
    return `
            <div class="pagination">
                <button disabled>Previous</button>
                <button class="active">1</button>
                <button disabled>Next</button>
            </div>
        `
  }

  // Search and filter methods
  setSearchQuery(query) {
    this.searchQuery = query
    // Debounce search
    clearTimeout(this.searchTimeout)
    this.searchTimeout = setTimeout(() => {
      this.loadTabContent(this.currentTab)
    }, 500)
  }

  setFilter(filter) {
    this.filterBy = filter
    this.loadTabContent(this.currentTab)
  }
}

// Global functions for HTML onclick handlers
window.switchTab = (tabName) => {
  window.adminDashboard.switchTab(tabName)
}

window.closeModal = (modalId) => {
  window.adminDashboard.closeModal(modalId)
}

window.redirectToAuth = () => {
  window.location.href = "auth.html"
}

window.handleLogout = async () => {
  try {
    await window.supabaseAuth.signOut()
    window.location.reload()
  } catch (error) {
    console.error("Logout error:", error)
  }
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.adminDashboard = new AdminDashboard()
  window.adminDashboard.initialize()
})
