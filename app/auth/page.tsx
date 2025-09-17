"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isExtension, setIsExtension] = useState(false)

  useEffect(() => {
    // Check if opened from extension
    const urlParams = new URLSearchParams(window.location.search)
    setIsExtension(urlParams.get("extension") === "true")
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simple authentication - replace with your actual auth logic
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const { token } = await response.json()

        if (isExtension) {
          // Store token for extension
          window.postMessage(
            {
              type: "EXTENSION_AUTH_SUCCESS",
              token: token,
            },
            "*",
          )

          // Show success message
          alert("Authentication successful! You can now close this tab and use the extension.")
        } else {
          // Redirect to dashboard
          window.location.href = "/dashboard"
        }
      } else {
        alert("Authentication failed")
      }
    } catch (error) {
      console.error("Auth error:", error)
      alert("Authentication error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isExtension ? "Extension Sign In" : "Sign In"}</CardTitle>
          <CardDescription>
            {isExtension ? "Sign in to use the Phone Scraper extension" : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          {isExtension && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                After signing in, this tab will close automatically and you can use the extension.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
