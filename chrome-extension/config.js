const CONFIG = {
  // Replace this with your actual Vercel deployment URL
  PRODUCTION_URL: "https://super-number-scraper.vercel.app",
  DEVELOPMENT_URL: "http://localhost:3000",

  // Auto-detect environment (you can modify this logic)
  getBaseUrl() {
    // For Chrome extension, we'll use production by default
    // You can manually switch this for testing
    const USE_PRODUCTION = true // Set to false for local development

    return USE_PRODUCTION ? this.PRODUCTION_URL : this.DEVELOPMENT_URL
  },
}

// Make config available globally
window.EXTENSION_CONFIG = CONFIG
