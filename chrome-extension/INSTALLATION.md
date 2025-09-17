# Chrome Extension Installation Guide

## Production Setup

### Step 1: Update Configuration
1. Open `config.js` file
2. Replace `"https://your-project-name.vercel.app"` with your actual Vercel URL
3. Set `USE_PRODUCTION = true` for live deployment

### Step 2: Install Extension
1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the `chrome-extension` folder

### Step 3: Test Connection
1. Click the extension icon in Chrome toolbar
2. Click "Test Connection" button
3. Should show "✅ Connection successful!"
4. Click "Sign In to Dashboard" to authenticate

### Step 4: Authentication
1. Extension will open your Vercel website
2. Sign in with your credentials
3. Extension will automatically receive authentication token
4. Return to extension popup to see available features

## Development Setup

### For Local Testing:
1. Set `USE_PRODUCTION = false` in `config.js`
2. Make sure your local server is running on `http://localhost:3000`
3. Follow steps 2-4 above

## Troubleshooting

### Connection Issues:
- Verify your Vercel URL is correct in `config.js`
- Check if website is deployed and accessible
- Ensure all environment variables are set in Vercel

### Authentication Issues:
- Clear extension storage: Chrome Settings > Privacy > Site Settings > View permissions > Chrome Extension
- Try signing out and signing in again
- Check browser console for error messages

### Permission Issues:
- Make sure `host_permissions` in `manifest.json` includes your domain
- Reload extension after making changes

## Features Available:
- 📞 Phone Number Scraping
- 💾 Data Storage to Supabase
- 📊 Dashboard Integration
- ⚙️ Server-driven Configuration
- 🔐 Secure Authentication
