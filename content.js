;(() => {
  // Phone number patterns
  const phonePatterns = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    /$$\d{3}$$\s*\d{3}[-.]?\d{4}/g,
    /\b\d{3}\s+\d{3}\s+\d{4}\b/g,
    /\+1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
  ]

  function extractPhoneNumbers() {
    const numbers = new Set()
    const textContent = document.body.innerText

    phonePatterns.forEach((pattern) => {
      const matches = textContent.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          const cleaned = match.replace(/\D/g, "")
          if (cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith("1"))) {
            numbers.add(match.trim())
          }
        })
      }
    })

    return Array.from(numbers)
  }

  // Listen for messages from popup/background
  window.chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrapeNumbers") {
      const numbers = extractPhoneNumbers()

      // Send to server instead of storing locally
      sendToServer(numbers)
        .then((result) => {
          sendResponse({ success: true, count: numbers.length, result })
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message })
        })

      return true // Keep message channel open
    }

    // Legacy support for getNumbers action
    if (request.action === "getNumbers") {
      const numbers = extractPhoneNumbers()
      sendResponse({ numbers })
    }
  })

  async function sendToServer(numbers) {
    try {
      // Get auth session from storage
      const session = await new Promise((resolve) => {
        window.chrome.storage.local.get(["auth_session"], (result) => {
          resolve(result.auth_session)
        })
      })

      if (!session) {
        throw new Error("Not authenticated")
      }

      // Send to server API
      const response = await window.fetch("https://your-domain.com/api/phone-numbers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numbers,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Server error")
      }

      return await response.json()
    } catch (error) {
      console.error("Error sending to server:", error)
      throw error
    }
  }
})()
