// Authentication page logic
class AuthPage {
  constructor() {
    this.isSignUp = false
    this.isLoading = false
    this.initializeElements()
    this.attachEventListeners()
    this.checkExistingAuth()
  }

  initializeElements() {
    this.form = document.getElementById("auth-form")
    this.emailInput = document.getElementById("email")
    this.passwordInput = document.getElementById("password")
    this.submitButton = document.getElementById("auth-submit")
    this.submitText = document.getElementById("submit-text")
    this.submitLoading = document.getElementById("submit-loading")
    this.toggleButton = document.getElementById("toggle-mode")
    this.toggleText = document.getElementById("toggle-text")
    this.authTitle = document.getElementById("auth-title")
    this.authSubtitle = document.getElementById("auth-subtitle")
    this.errorMessage = document.getElementById("error-message")
    this.successMessage = document.getElementById("success-message")
  }

  attachEventListeners() {
    this.form.addEventListener("submit", (e) => this.handleSubmit(e))
    this.toggleButton.addEventListener("click", () => this.toggleMode())
  }

  async checkExistingAuth() {
    try {
      await window.supabaseAuth.initialize()
      if (window.supabaseAuth.isAuthenticated()) {
        // User is already authenticated, redirect to main popup
        window.location.href = "popup.html"
      }
    } catch (error) {
      console.error("Error checking existing auth:", error)
    }
  }

  toggleMode() {
    this.isSignUp = !this.isSignUp
    this.updateUI()
    this.clearMessages()
  }

  updateUI() {
    if (this.isSignUp) {
      this.authTitle.textContent = "Sign Up"
      this.authSubtitle.textContent = "Create your account"
      this.submitText.textContent = "Sign Up"
      this.toggleText.textContent = "Already have an account?"
      this.toggleButton.textContent = "Sign In"
    } else {
      this.authTitle.textContent = "Sign In"
      this.authSubtitle.textContent = "Access your server-driven extension"
      this.submitText.textContent = "Sign In"
      this.toggleText.textContent = "Don't have an account?"
      this.toggleButton.textContent = "Sign Up"
    }
  }

  async handleSubmit(e) {
    e.preventDefault()

    if (this.isLoading) return

    const email = this.emailInput.value.trim()
    const password = this.passwordInput.value

    if (!email || !password) {
      this.showError("Please fill in all fields")
      return
    }

    if (password.length < 6) {
      this.showError("Password must be at least 6 characters")
      return
    }

    this.setLoading(true)
    this.clearMessages()

    try {
      let result
      if (this.isSignUp) {
        result = await window.supabaseAuth.signUp(email, password)
      } else {
        result = await window.supabaseAuth.signIn(email, password)
      }

      if (result.error) {
        this.showError(result.error)
      } else if (result.user) {
        if (this.isSignUp && !result.user.email_confirmed_at) {
          this.showSuccess("Please check your email to confirm your account")
        } else {
          this.showSuccess("Authentication successful!")
          // Redirect to main popup after a short delay
          setTimeout(() => {
            window.location.href = "popup.html"
          }, 1000)
        }
      }
    } catch (error) {
      console.error("Auth error:", error)
      this.showError("An unexpected error occurred. Please try again.")
    } finally {
      this.setLoading(false)
    }
  }

  setLoading(loading) {
    this.isLoading = loading
    this.submitButton.disabled = loading

    if (loading) {
      this.submitText.style.display = "none"
      this.submitLoading.style.display = "flex"
    } else {
      this.submitText.style.display = "block"
      this.submitLoading.style.display = "none"
    }
  }

  showError(message) {
    this.errorMessage.textContent = message
    this.errorMessage.style.display = "block"
    this.successMessage.style.display = "none"
  }

  showSuccess(message) {
    this.successMessage.textContent = message
    this.successMessage.style.display = "block"
    this.errorMessage.style.display = "none"
  }

  clearMessages() {
    this.errorMessage.style.display = "none"
    this.successMessage.style.display = "none"
  }
}

// Initialize auth page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new AuthPage()
})
