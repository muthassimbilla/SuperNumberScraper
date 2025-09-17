// Minimal content script for phone number scraping
class PhoneScraper {
  constructor() {
    this.phoneRegex = /(\+?1[-.\s]?)?$$?([0-9]{3})$$?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g
    this.setupListeners()
  }

  setupListeners() {
    // Listen for scraping trigger from popup
    window.addEventListener("message", (event) => {
      if (event.data.type === "START_SCRAPING") {
        this.scrapePhones()
      }
    })
  }

  scrapePhones() {
    try {
      const phones = []
      const textContent = document.body.innerText

      // Find all phone numbers using regex
      let match
      while ((match = this.phoneRegex.exec(textContent)) !== null) {
        const phone = match[0].trim()
        if (phone && !phones.includes(phone)) {
          phones.push(phone)
        }
      }

      // Send found phones to background script
      window.chrome.runtime.sendMessage({
        type: "PHONE_DATA",
        data: phones,
      })
    } catch (error) {
      console.error("Phone scraping failed:", error)
    }
  }
}

// Initialize scraper when content script loads
new PhoneScraper()
