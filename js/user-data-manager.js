// User Data Management System for Server-Driven Extension
class UserDataManager {
  constructor(auth, serverAPI) {
    this.auth = auth
    this.serverAPI = serverAPI
    this.cache = new Map()
    this.syncQueue = []
    this.isOnline = navigator.onLine
    this.setupEventListeners()
  }

  setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener("online", () => {
      this.isOnline = true
      this.processSyncQueue()
    })

    window.addEventListener("offline", () => {
      this.isOnline = false
    })
  }

  // Save user data with offline support
  async saveData(feature, data, options = {}) {
    if (!this.auth.isAuthenticated()) {
      throw new Error("User must be authenticated to save data")
    }

    const dataEntry = {
      id: this.generateId(),
      user_id: this.auth.currentUser.id,
      feature: feature,
      data: data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...options,
    }

    try {
      if (this.isOnline) {
        // Save directly to server
        const success = await this.serverAPI.saveUserData(feature, data)
        if (success) {
          // Update cache
          this.updateCache(feature, dataEntry)
          return { success: true, id: dataEntry.id }
        } else {
          throw new Error("Failed to save to server")
        }
      } else {
        // Save to local storage and queue for sync
        await this.saveToLocalStorage(dataEntry)
        this.queueForSync(dataEntry)
        return { success: true, id: dataEntry.id, offline: true }
      }
    } catch (error) {
      console.error("Error saving data:", error)

      // Fallback to local storage
      await this.saveToLocalStorage(dataEntry)
      this.queueForSync(dataEntry)

      return { success: false, error: error.message, id: dataEntry.id }
    }
  }

  // Get user data with caching
  async getData(feature = null, options = {}) {
    if (!this.auth.isAuthenticated()) {
      return []
    }

    const cacheKey = feature || "all"

    // Check cache first
    if (this.cache.has(cacheKey) && !options.forceRefresh) {
      return this.cache.get(cacheKey)
    }

    try {
      let data = []

      if (this.isOnline) {
        // Get from server
        data = await this.serverAPI.getUserData(feature)

        // Merge with local data that hasn't been synced
        const localData = await this.getLocalData(feature)
        const unsyncedData = localData.filter((item) => !item.synced)
        data = [...data, ...unsyncedData]
      } else {
        // Get from local storage only
        data = await this.getLocalData(feature)
      }

      // Update cache
      this.cache.set(cacheKey, data)

      return data
    } catch (error) {
      console.error("Error getting data:", error)

      // Fallback to local storage
      return await this.getLocalData(feature)
    }
  }

  // Update existing data
  async updateData(id, updates) {
    if (!this.auth.isAuthenticated()) {
      throw new Error("User must be authenticated to update data")
    }

    const updateEntry = {
      id: id,
      ...updates,
      updated_at: new Date().toISOString(),
    }

    try {
      if (this.isOnline) {
        // Update on server (this would need a server endpoint)
        // For now, we'll treat it as a new save
        const success = await this.serverAPI.saveUserData(updates.feature, updates.data)
        if (success) {
          this.invalidateCache()
          return { success: true }
        }
      } else {
        // Update in local storage and queue for sync
        await this.updateLocalStorage(id, updateEntry)
        this.queueForSync(updateEntry, "update")
        return { success: true, offline: true }
      }
    } catch (error) {
      console.error("Error updating data:", error)

      // Fallback to local storage
      await this.updateLocalStorage(id, updateEntry)
      this.queueForSync(updateEntry, "update")

      return { success: false, error: error.message }
    }
  }

  // Delete data
  async deleteData(id, feature) {
    if (!this.auth.isAuthenticated()) {
      throw new Error("User must be authenticated to delete data")
    }

    try {
      if (this.isOnline) {
        // Delete from server (would need server endpoint)
        // For now, we'll just remove from local cache
        await this.removeFromLocalStorage(id)
        this.invalidateCache()
        return { success: true }
      } else {
        // Mark for deletion and queue for sync
        await this.markForDeletion(id)
        this.queueForSync({ id, feature }, "delete")
        return { success: true, offline: true }
      }
    } catch (error) {
      console.error("Error deleting data:", error)
      return { success: false, error: error.message }
    }
  }

  // Get data statistics
  async getDataStats() {
    if (!this.auth.isAuthenticated()) {
      return { total: 0, by_feature: {} }
    }

    try {
      const allData = await this.getData()
      const stats = {
        total: allData.length,
        by_feature: {},
        last_updated: null,
      }

      // Group by feature
      allData.forEach((item) => {
        const feature = item.feature
        if (!stats.by_feature[feature]) {
          stats.by_feature[feature] = 0
        }
        stats.by_feature[feature]++

        // Track latest update
        const updatedAt = new Date(item.updated_at || item.created_at)
        if (!stats.last_updated || updatedAt > stats.last_updated) {
          stats.last_updated = updatedAt
        }
      })

      return stats
    } catch (error) {
      console.error("Error getting data stats:", error)
      return { total: 0, by_feature: {}, error: error.message }
    }
  }

  // Export user data
  async exportData(format = "json", feature = null) {
    if (!this.auth.isAuthenticated()) {
      throw new Error("User must be authenticated to export data")
    }

    try {
      const data = await this.getData(feature)

      switch (format.toLowerCase()) {
        case "json":
          return this.exportAsJSON(data)
        case "csv":
          return this.exportAsCSV(data)
        case "txt":
          return this.exportAsText(data)
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
    } catch (error) {
      console.error("Error exporting data:", error)
      throw error
    }
  }

  // Import user data
  async importData(data, format = "json", options = {}) {
    if (!this.auth.isAuthenticated()) {
      throw new Error("User must be authenticated to import data")
    }

    try {
      let parsedData

      switch (format.toLowerCase()) {
        case "json":
          parsedData = this.parseJSONImport(data)
          break
        case "csv":
          parsedData = this.parseCSVImport(data)
          break
        default:
          throw new Error(`Unsupported import format: ${format}`)
      }

      // Validate and save imported data
      const results = {
        imported: 0,
        skipped: 0,
        errors: [],
      }

      for (const item of parsedData) {
        try {
          if (options.skipDuplicates && (await this.isDuplicate(item))) {
            results.skipped++
            continue
          }

          await this.saveData(item.feature, item.data)
          results.imported++
        } catch (error) {
          results.errors.push({
            item: item,
            error: error.message,
          })
        }
      }

      return results
    } catch (error) {
      console.error("Error importing data:", error)
      throw error
    }
  }

  // Sync offline data when back online
  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return
    }

    console.log(`Processing ${this.syncQueue.length} queued items...`)

    const results = {
      synced: 0,
      failed: 0,
      errors: [],
    }

    // Process queue items
    for (let i = this.syncQueue.length - 1; i >= 0; i--) {
      const item = this.syncQueue[i]

      try {
        switch (item.operation) {
          case "create":
          case "update":
            const success = await this.serverAPI.saveUserData(item.data.feature, item.data.data)
            if (success) {
              // Mark as synced in local storage
              await this.markAsSynced(item.data.id)
              this.syncQueue.splice(i, 1)
              results.synced++
            } else {
              throw new Error("Server save failed")
            }
            break
          case "delete":
            // Would need server delete endpoint
            await this.removeFromLocalStorage(item.data.id)
            this.syncQueue.splice(i, 1)
            results.synced++
            break
        }
      } catch (error) {
        console.error("Sync error for item:", item, error)
        results.failed++
        results.errors.push({
          item: item,
          error: error.message,
        })
      }
    }

    // Clear cache to force refresh
    this.invalidateCache()

    console.log("Sync results:", results)
    return results
  }

  // Local storage operations
  async saveToLocalStorage(data) {
    const key = `user_data_${this.auth.currentUser.id}`
    const existing = (await this.getFromStorage(key)) || []
    existing.push({ ...data, synced: false })
    await this.setToStorage(key, existing)
  }

  async getLocalData(feature = null) {
    const key = `user_data_${this.auth.currentUser.id}`
    const data = (await this.getFromStorage(key)) || []

    if (feature) {
      return data.filter((item) => item.feature === feature)
    }

    return data
  }

  async updateLocalStorage(id, updates) {
    const key = `user_data_${this.auth.currentUser.id}`
    const data = (await this.getFromStorage(key)) || []
    const index = data.findIndex((item) => item.id === id)

    if (index !== -1) {
      data[index] = { ...data[index], ...updates, synced: false }
      await this.setToStorage(key, data)
    }
  }

  async removeFromLocalStorage(id) {
    const key = `user_data_${this.auth.currentUser.id}`
    const data = (await this.getFromStorage(key)) || []
    const filtered = data.filter((item) => item.id !== id)
    await this.setToStorage(key, filtered)
  }

  async markAsSynced(id) {
    const key = `user_data_${this.auth.currentUser.id}`
    const data = (await this.getFromStorage(key)) || []
    const index = data.findIndex((item) => item.id === id)

    if (index !== -1) {
      data[index].synced = true
      await this.setToStorage(key, data)
    }
  }

  async markForDeletion(id) {
    const key = `user_data_${this.auth.currentUser.id}`
    const data = (await this.getFromStorage(key)) || []
    const index = data.findIndex((item) => item.id === id)

    if (index !== -1) {
      data[index].deleted = true
      data[index].synced = false
      await this.setToStorage(key, data)
    }
  }

  // Chrome storage helpers
  async getFromStorage(key) {
    const chrome = window.chrome // Declare chrome variable
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key])
      })
    })
  }

  async setToStorage(key, value) {
    const chrome = window.chrome // Declare chrome variable
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve)
    })
  }

  // Export helpers
  exportAsJSON(data) {
    return {
      format: "json",
      data: JSON.stringify(data, null, 2),
      filename: `user_data_${new Date().toISOString().split("T")[0]}.json`,
    }
  }

  exportAsCSV(data) {
    if (data.length === 0) {
      return {
        format: "csv",
        data: "No data to export",
        filename: `user_data_${new Date().toISOString().split("T")[0]}.csv`,
      }
    }

    // Get all unique keys
    const keys = new Set()
    data.forEach((item) => {
      keys.add("feature")
      keys.add("created_at")
      keys.add("updated_at")
      if (typeof item.data === "object") {
        Object.keys(item.data).forEach((key) => keys.add(`data_${key}`))
      } else {
        keys.add("data")
      }
    })

    const headers = Array.from(keys)
    const rows = data.map((item) => {
      return headers.map((header) => {
        if (header === "feature") return item.feature
        if (header === "created_at") return item.created_at
        if (header === "updated_at") return item.updated_at
        if (header.startsWith("data_")) {
          const dataKey = header.replace("data_", "")
          return typeof item.data === "object" ? item.data[dataKey] || "" : ""
        }
        if (header === "data") {
          return typeof item.data === "object" ? JSON.stringify(item.data) : item.data
        }
        return ""
      })
    })

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    return {
      format: "csv",
      data: csvContent,
      filename: `user_data_${new Date().toISOString().split("T")[0]}.csv`,
    }
  }

  exportAsText(data) {
    const textContent = data
      .map((item) => {
        return `Feature: ${item.feature}\nCreated: ${item.created_at}\nData: ${JSON.stringify(item.data, null, 2)}\n---\n`
      })
      .join("\n")

    return {
      format: "txt",
      data: textContent,
      filename: `user_data_${new Date().toISOString().split("T")[0]}.txt`,
    }
  }

  // Import helpers
  parseJSONImport(data) {
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) ? parsed : [parsed]
  }

  parseCSVImport(data) {
    const lines = data.split("\n")
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, ""))

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.replace(/"/g, ""))
      const item = { data: {} }

      headers.forEach((header, index) => {
        if (header === "feature") {
          item.feature = values[index]
        } else if (header.startsWith("data_")) {
          const dataKey = header.replace("data_", "")
          item.data[dataKey] = values[index]
        } else if (header === "data") {
          try {
            item.data = JSON.parse(values[index])
          } catch {
            item.data = values[index]
          }
        }
      })

      return item
    })
  }

  // Utility functions
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  queueForSync(data, operation = "create") {
    this.syncQueue.push({
      data: data,
      operation: operation,
      timestamp: Date.now(),
    })
  }

  updateCache(feature, data) {
    const cacheKey = feature
    if (this.cache.has(cacheKey)) {
      const existing = this.cache.get(cacheKey)
      existing.push(data)
      this.cache.set(cacheKey, existing)
    }

    // Also update 'all' cache
    if (this.cache.has("all")) {
      const allData = this.cache.get("all")
      allData.push(data)
      this.cache.set("all", allData)
    }
  }

  invalidateCache() {
    this.cache.clear()
  }

  async isDuplicate(item) {
    const existing = await this.getData(item.feature)
    return existing.some((existingItem) => JSON.stringify(existingItem.data) === JSON.stringify(item.data))
  }
}

// Export for use in other scripts
window.UserDataManager = UserDataManager

// Initialize global instance when auth is ready
window.addEventListener("load", () => {
  if (window.supabaseAuth && window.serverAPI) {
    window.userDataManager = new UserDataManager(window.supabaseAuth, window.serverAPI)
  }
})
