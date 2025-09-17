// Data Viewer Component for User Data Management
class DataViewer {
  constructor(userDataManager) {
    this.userDataManager = userDataManager
    this.currentView = "list"
    this.currentFeature = null
    this.sortBy = "created_at"
    this.sortOrder = "desc"
    this.searchQuery = ""
  }

  // Render data viewer interface
  async render(container) {
    const stats = await this.userDataManager.getDataStats()

    container.innerHTML = `
            <div class="data-viewer">
                <div class="data-viewer-header">
                    <h3>Your Data</h3>
                    <div class="data-stats">
                        <span class="stat-item">Total: ${stats.total}</span>
                        <span class="stat-item">Features: ${Object.keys(stats.by_feature).length}</span>
                        ${stats.last_updated ? `<span class="stat-item">Last Updated: ${this.formatDate(stats.last_updated)}</span>` : ""}
                    </div>
                </div>

                <div class="data-viewer-controls">
                    <div class="view-controls">
                        <button class="view-btn ${this.currentView === "list" ? "active" : ""}" 
                                onclick="dataViewer.setView('list')">List</button>
                        <button class="view-btn ${this.currentView === "stats" ? "active" : ""}" 
                                onclick="dataViewer.setView('stats')">Statistics</button>
                        <button class="view-btn ${this.currentView === "export" ? "active" : ""}" 
                                onclick="dataViewer.setView('export')">Export</button>
                    </div>

                    <div class="filter-controls">
                        <select id="feature-filter" onchange="dataViewer.setFeatureFilter(this.value)">
                            <option value="">All Features</option>
                            ${Object.keys(stats.by_feature)
                              .map(
                                (feature) =>
                                  `<option value="${feature}" ${this.currentFeature === feature ? "selected" : ""}>${feature}</option>`,
                              )
                              .join("")}
                        </select>

                        <input type="text" id="search-input" placeholder="Search data..." 
                               value="${this.searchQuery}" onkeyup="dataViewer.setSearchQuery(this.value)">
                    </div>
                </div>

                <div class="data-viewer-content" id="data-viewer-content">
                    ${await this.renderContent()}
                </div>
            </div>
        `

    this.attachStyles()
  }

  // Render content based on current view
  async renderContent() {
    switch (this.currentView) {
      case "list":
        return await this.renderListView()
      case "stats":
        return await this.renderStatsView()
      case "export":
        return await this.renderExportView()
      default:
        return '<div class="empty-state">Unknown view</div>'
    }
  }

  // Render list view
  async renderListView() {
    try {
      let data = await this.userDataManager.getData(this.currentFeature)

      // Apply search filter
      if (this.searchQuery) {
        data = data.filter(
          (item) =>
            JSON.stringify(item.data).toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            item.feature.toLowerCase().includes(this.searchQuery.toLowerCase()),
        )
      }

      // Apply sorting
      data.sort((a, b) => {
        const aVal = a[this.sortBy] || ""
        const bVal = b[this.sortBy] || ""

        if (this.sortOrder === "asc") {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })

      if (data.length === 0) {
        return `
                    <div class="empty-state">
                        <h4>No Data Found</h4>
                        <p>${this.searchQuery ? "No data matches your search." : "You haven't saved any data yet."}</p>
                    </div>
                `
      }

      return `
                <div class="data-list">
                    <div class="data-list-header">
                        <div class="sort-controls">
                            <label>Sort by:</label>
                            <select onchange="dataViewer.setSortBy(this.value)">
                                <option value="created_at" ${this.sortBy === "created_at" ? "selected" : ""}>Date Created</option>
                                <option value="updated_at" ${this.sortBy === "updated_at" ? "selected" : ""}>Date Updated</option>
                                <option value="feature" ${this.sortBy === "feature" ? "selected" : ""}>Feature</option>
                            </select>
                            <button onclick="dataViewer.toggleSortOrder()" class="sort-order-btn">
                                ${this.sortOrder === "asc" ? "↑" : "↓"}
                            </button>
                        </div>
                        <div class="list-count">${data.length} items</div>
                    </div>

                    <div class="data-items">
                        ${data.map((item) => this.renderDataItem(item)).join("")}
                    </div>
                </div>
            `
    } catch (error) {
      return `<div class="error-message">Error loading data: ${error.message}</div>`
    }
  }

  // Render individual data item
  renderDataItem(item) {
    const isOffline = item.synced === false

    return `
            <div class="data-item ${isOffline ? "offline" : ""}" data-id="${item.id}">
                <div class="data-item-header">
                    <span class="feature-badge">${item.feature}</span>
                    <span class="date-info">${this.formatDate(item.created_at)}</span>
                    ${isOffline ? '<span class="offline-badge">Not Synced</span>' : ""}
                </div>
                <div class="data-item-content">
                    <pre>${JSON.stringify(item.data, null, 2)}</pre>
                </div>
                <div class="data-item-actions">
                    <button onclick="dataViewer.copyData('${item.id}')" class="action-btn copy-btn">Copy</button>
                    <button onclick="dataViewer.deleteData('${item.id}')" class="action-btn delete-btn">Delete</button>
                </div>
            </div>
        `
  }

  // Render statistics view
  async renderStatsView() {
    try {
      const stats = await this.userDataManager.getDataStats()

      return `
                <div class="stats-view">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h4>Total Records</h4>
                            <div class="stat-value">${stats.total}</div>
                        </div>
                        
                        <div class="stat-card">
                            <h4>Features Used</h4>
                            <div class="stat-value">${Object.keys(stats.by_feature).length}</div>
                        </div>
                        
                        <div class="stat-card">
                            <h4>Last Activity</h4>
                            <div class="stat-value">${stats.last_updated ? this.formatDate(stats.last_updated) : "Never"}</div>
                        </div>
                    </div>

                    <div class="feature-breakdown">
                        <h4>Data by Feature</h4>
                        <div class="feature-stats">
                            ${Object.entries(stats.by_feature)
                              .map(
                                ([feature, count]) => `
                                <div class="feature-stat">
                                    <span class="feature-name">${feature}</span>
                                    <span class="feature-count">${count} records</span>
                                    <div class="feature-bar">
                                        <div class="feature-bar-fill" style="width: ${(count / stats.total) * 100}%"></div>
                                    </div>
                                </div>
                            `,
                              )
                              .join("")}
                        </div>
                    </div>
                </div>
            `
    } catch (error) {
      return `<div class="error-message">Error loading statistics: ${error.message}</div>`
    }
  }

  // Render export view
  renderExportView() {
    return `
            <div class="export-view">
                <div class="export-options">
                    <h4>Export Your Data</h4>
                    <p>Choose a format to download your data:</p>
                    
                    <div class="export-formats">
                        <button onclick="dataViewer.exportData('json')" class="export-btn">
                            <strong>JSON</strong>
                            <span>Machine-readable format</span>
                        </button>
                        
                        <button onclick="dataViewer.exportData('csv')" class="export-btn">
                            <strong>CSV</strong>
                            <span>Spreadsheet compatible</span>
                        </button>
                        
                        <button onclick="dataViewer.exportData('txt')" class="export-btn">
                            <strong>Text</strong>
                            <span>Human-readable format</span>
                        </button>
                    </div>
                </div>

                <div class="import-options">
                    <h4>Import Data</h4>
                    <p>Upload a file to import data:</p>
                    
                    <div class="import-controls">
                        <input type="file" id="import-file" accept=".json,.csv" onchange="dataViewer.handleFileImport(this)">
                        <label class="import-options-label">
                            <input type="checkbox" id="skip-duplicates" checked> Skip duplicates
                        </label>
                    </div>
                </div>
            </div>
        `
  }

  // Event handlers
  async setView(view) {
    this.currentView = view
    const content = document.getElementById("data-viewer-content")
    if (content) {
      content.innerHTML = await this.renderContent()
    }

    // Update active button
    document.querySelectorAll(".view-btn").forEach((btn) => btn.classList.remove("active"))
    document.querySelector(`.view-btn[onclick*="${view}"]`).classList.add("active")
  }

  async setFeatureFilter(feature) {
    this.currentFeature = feature || null
    await this.refreshContent()
  }

  async setSearchQuery(query) {
    this.searchQuery = query
    if (this.currentView === "list") {
      await this.refreshContent()
    }
  }

  async setSortBy(sortBy) {
    this.sortBy = sortBy
    if (this.currentView === "list") {
      await this.refreshContent()
    }
  }

  async toggleSortOrder() {
    this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc"
    if (this.currentView === "list") {
      await this.refreshContent()
    }
  }

  async refreshContent() {
    const content = document.getElementById("data-viewer-content")
    if (content) {
      content.innerHTML = await this.renderContent()
    }
  }

  // Data actions
  async copyData(id) {
    try {
      const data = await this.userDataManager.getData()
      const item = data.find((d) => d.id === id)

      if (item) {
        await navigator.clipboard.writeText(JSON.stringify(item.data, null, 2))
        this.showToast("Data copied to clipboard")
      }
    } catch (error) {
      this.showToast("Failed to copy data", "error")
    }
  }

  async deleteData(id) {
    if (confirm("Are you sure you want to delete this data?")) {
      try {
        await this.userDataManager.deleteData(id)
        await this.refreshContent()
        this.showToast("Data deleted successfully")
      } catch (error) {
        this.showToast("Failed to delete data", "error")
      }
    }
  }

  async exportData(format) {
    try {
      const exportResult = await this.userDataManager.exportData(format, this.currentFeature)
      this.downloadFile(exportResult.data, exportResult.filename, exportResult.format)
      this.showToast(`Data exported as ${format.toUpperCase()}`)
    } catch (error) {
      this.showToast("Failed to export data", "error")
    }
  }

  async handleFileImport(input) {
    const file = input.files[0]
    if (!file) return

    const skipDuplicates = document.getElementById("skip-duplicates").checked

    try {
      const text = await file.text()
      const format = file.name.endsWith(".csv") ? "csv" : "json"

      const result = await this.userDataManager.importData(text, format, { skipDuplicates })

      this.showToast(`Imported ${result.imported} items, skipped ${result.skipped}`)

      if (result.errors.length > 0) {
        console.warn("Import errors:", result.errors)
      }

      await this.refreshContent()
    } catch (error) {
      this.showToast("Failed to import data", "error")
    }
  }

  // Utility functions
  formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  downloadFile(content, filename, format) {
    const blob = new Blob([content], {
      type: format === "json" ? "application/json" : format === "csv" ? "text/csv" : "text/plain",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  showToast(message, type = "success") {
    // Simple toast notification
    const toast = document.createElement("div")
    toast.className = `toast toast-${type}`
    toast.textContent = message
    toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === "error" ? "#dc2626" : "#16a34a"};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `

    document.body.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, 3000)
  }

  // Attach styles
  attachStyles() {
    if (document.getElementById("data-viewer-styles")) return

    const styles = document.createElement("style")
    styles.id = "data-viewer-styles"
    styles.textContent = `
            .data-viewer {
                background: white;
                border-radius: 12px;
                padding: 20px;
                border: 1px solid #e2e8f0;
            }

            .data-viewer-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 16px;
                border-bottom: 1px solid #e2e8f0;
            }

            .data-viewer-header h3 {
                margin: 0;
                color: #1e293b;
            }

            .data-stats {
                display: flex;
                gap: 16px;
                font-size: 12px;
                color: #64748b;
            }

            .data-viewer-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                gap: 16px;
            }

            .view-controls {
                display: flex;
                gap: 4px;
            }

            .view-btn {
                padding: 8px 16px;
                border: 1px solid #e2e8f0;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
            }

            .view-btn:hover {
                background: #f1f5f9;
            }

            .view-btn.active {
                background: #667eea;
                color: white;
                border-color: #667eea;
            }

            .filter-controls {
                display: flex;
                gap: 8px;
            }

            .filter-controls select,
            .filter-controls input {
                padding: 8px 12px;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                font-size: 14px;
            }

            .data-item {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                margin-bottom: 12px;
                overflow: hidden;
            }

            .data-item.offline {
                border-color: #f59e0b;
                background: #fffbeb;
            }

            .data-item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: #f8fafc;
                border-bottom: 1px solid #e2e8f0;
            }

            .feature-badge {
                background: #667eea;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
            }

            .offline-badge {
                background: #f59e0b;
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
            }

            .data-item-content {
                padding: 16px;
            }

            .data-item-content pre {
                margin: 0;
                font-size: 12px;
                color: #374151;
                white-space: pre-wrap;
                word-break: break-word;
            }

            .data-item-actions {
                display: flex;
                gap: 8px;
                padding: 12px 16px;
                background: #f8fafc;
                border-top: 1px solid #e2e8f0;
            }

            .action-btn {
                padding: 6px 12px;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
                background: white;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }

            .action-btn:hover {
                background: #f1f5f9;
            }

            .delete-btn:hover {
                background: #fef2f2;
                border-color: #fecaca;
                color: #dc2626;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 16px;
                margin-bottom: 24px;
            }

            .stat-card {
                background: #f8fafc;
                padding: 16px;
                border-radius: 8px;
                text-align: center;
            }

            .stat-card h4 {
                margin: 0 0 8px 0;
                font-size: 14px;
                color: #64748b;
            }

            .stat-value {
                font-size: 24px;
                font-weight: 600;
                color: #1e293b;
            }

            .feature-breakdown {
                margin-top: 24px;
            }

            .feature-stat {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
            }

            .feature-name {
                min-width: 120px;
                font-weight: 500;
            }

            .feature-count {
                min-width: 80px;
                font-size: 14px;
                color: #64748b;
            }

            .feature-bar {
                flex: 1;
                height: 8px;
                background: #e2e8f0;
                border-radius: 4px;
                overflow: hidden;
            }

            .feature-bar-fill {
                height: 100%;
                background: #667eea;
                transition: width 0.3s ease;
            }

            .export-formats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 12px;
                margin-bottom: 32px;
            }

            .export-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 20px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .export-btn:hover {
                border-color: #667eea;
                background: #f8fafc;
            }

            .export-btn strong {
                margin-bottom: 4px;
                color: #1e293b;
            }

            .export-btn span {
                font-size: 12px;
                color: #64748b;
            }

            .import-controls {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .import-options-label {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: #64748b;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `

    document.head.appendChild(styles)
  }
}

// Export for global use
window.DataViewer = DataViewer
