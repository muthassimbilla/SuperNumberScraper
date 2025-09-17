import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Phone Scraper Extension Control Panel",
  description: "Chrome Extension এর জন্য Web Control Panel - Phone numbers scrape এবং manage করুন",
  generator: "v0.app",
  keywords: ["chrome extension", "phone scraper", "web scraping", "control panel"],
  authors: [{ name: "Your Name" }],
  openGraph: {
    title: "Phone Scraper Extension Control Panel",
    description: "Chrome Extension এর জন্য Web Control Panel",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
