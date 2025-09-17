class APIClient {
  constructor() {
    this.baseUrl = "https://your-domain.com/api"
  }

  async getSession() {
    return new Promise((resolve) => {
      window.chrome.storage.local.get(["auth_session"], (result) => {
        resolve(result.auth_session)
      })
    })
  }

  async request(endpoint, options = {}) {
    const session = await this.getSession()

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(session && { Authorization: `Bearer ${session.access_token}` }),
      },
      ...options,
    }

    const response = await window.fetch(`${this.baseUrl}${endpoint}`, config)

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  async getUIConfig() {
    return this.request("/ui-config")
  }

  async savePhoneNumbers(numbers, metadata = {}) {
    return this.request("/phone-numbers", {
      method: "POST",
      body: JSON.stringify({ numbers, metadata }),
    })
  }

  async getUserData() {
    return this.request("/user-data")
  }
}

window.APIClient = APIClient
