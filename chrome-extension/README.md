# Minimal Phone Scraper Extension

This is the lightweight Chrome extension that connects to your server for phone number management.

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this folder
4. The extension will appear in your toolbar

## Configuration

Before using the extension, update the following in the code:

1. **Server URL**: Replace `https://your-domain.com/api` with your actual server URL in:
   - `popup.js` (line 4)
   - `background.js` (line 4)

2. **Host Permissions**: Update `manifest.json` to include your domain:
   \`\`\`json
   "host_permissions": ["https://your-actual-domain.com/*"]
   \`\`\`

## Features

- **Minimal Code**: Only essential extension functionality
- **Server-Driven**: All business logic handled by your server
- **Authentication**: Connects to your website for user authentication
- **Phone Scraping**: Lightweight content script for phone number extraction
- **API Integration**: Sends all data to your server endpoints

## Server Endpoints Required

Your server needs to implement these endpoints:

- `POST /api/verify-token` - Verify authentication token
- `GET /api/ui-config` - Return UI configuration JSON
- `POST /api/execute-feature` - Handle feature execution
- `POST /api/phone-data` - Receive scraped phone data

## File Structure

\`\`\`
chrome-extension/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js           # Popup functionality
├── background.js      # Background service worker
├── content.js         # Content script for scraping
└── README.md          # This file
\`\`\`

## Usage

1. User clicks extension icon
2. Extension checks authentication with your server
3. If authenticated, loads UI configuration from server
4. User clicks features, extension executes via server API
5. For scraping, extension extracts phones and sends to server
6. Complex operations redirect to your website

This keeps the extension minimal while giving you full control from your server.
