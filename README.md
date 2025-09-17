# 🔧 Server Controlled Chrome Extension

একটি **server-controlled Chrome extension** যেটি সম্পূর্ণভাবে আপনার website থেকে control হয়। Extension এর ভেতরে কোনো hardcoded UI/feature থাকে না - সবকিছু server থেকে dynamically load হয়।

## 🌟 Key Features

### ✅ Server-Controlled Architecture
- Extension শুধু একটি **empty shell**
- সমস্ত UI, features, এবং content server থেকে আসে
- Extension update ছাড়াই যেকোনো পরিবর্তন possible

### ✅ Dynamic UI System
- Server থেকে JSON config অনুযায়ী UI render হয়
- Real-time theme switching (light/dark)
- Custom layouts এবং components

### ✅ User Management
- Supabase authentication
- Free/Premium subscription system
- Row Level Security (RLS) দিয়ে data protection

### ✅ Feature Control
- Premium/free features আলাদা control
- Server-side feature execution
- User-specific data storage

### ✅ Admin Dashboard
- User management
- Feature configuration
- Analytics এবং usage stats
- Real-time monitoring

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Chrome         │    │  Next.js         │    │  Supabase       │
│  Extension      │◄──►│  Website/API     │◄──►│  Database       │
│  (Empty Shell)  │    │  (Control Panel) │    │  + Auth         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow:
1. **Extension startup** → Server config fetch
2. **User login** → Supabase authentication
3. **UI rendering** → Dynamic based on server response
4. **Feature execution** → API calls to server
5. **Data storage** → User-specific data in Supabase

## 📁 Project Structure

```
├── 📁 extension/           # Chrome Extension files
│   ├── manifest.json       # Extension manifest
│   ├── background.js       # Service worker
│   ├── popup.html          # Extension popup
│   ├── popup.js            # Dynamic UI logic
│   ├── popup.css           # Modern styling
│   └── supabase.js         # Supabase integration
│
├── 📁 website/             # Next.js Website
│   ├── 📁 app/             # App Router
│   │   ├── 📁 api/         # API routes
│   │   │   ├── auth/       # Authentication
│   │   │   ├── config/     # Extension config
│   │   │   ├── run-feature/# Feature execution
│   │   │   ├── users/      # User management
│   │   │   └── admin/      # Admin dashboard
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Homepage
│   ├── 📁 components/      # React components
│   ├── 📁 lib/             # Utilities
│   ├── 📁 types/           # TypeScript types
│   └── 📁 database/        # SQL schema
└── README.md
```

## 🚀 Setup Instructions

### 1. Supabase Setup

#### Create Project
```bash
# Supabase এ যান এবং নতুন project তৈরি করুন
# Database URL এবং Keys copy করুন
```

#### Database Schema
```sql
# website/database/schema.sql file চালান
# এতে সব tables, RLS policies, এবং functions আছে
```

#### Environment Variables
```bash
# website/.env.local তৈরি করুন
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
```

### 2. Website Setup

```bash
cd website
npm install
npm run dev
```

### 3. Extension Setup

#### Chrome Extension Load
1. Chrome এ `chrome://extensions/` যান
2. "Developer mode" enable করুন
3. "Load unpacked" click করে extension folder select করুন

#### Extension Configuration
```javascript
// background.js এ API URL update করুন
const CONFIG = {
  API_BASE_URL: 'http://localhost:3000/api', // Your domain
  // ...
}
```

## 📡 API Endpoints

### Authentication
```http
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}
```

### Configuration
```http
GET /api/config?user_id=USER_ID
Authorization: Bearer TOKEN
```

### Feature Execution
```http
POST /api/run-feature
Authorization: Bearer TOKEN
{
  "user_id": "user-id",
  "feature": "note_taking",
  "action": "save",
  "input": "My note content"
}
```

### Admin Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer ADMIN_TOKEN
```

## 🎯 Extension Configuration Format

```json
{
  "title": "My Extension",
  "version": "1.0.0",
  "theme": "light",
  "layout": "default",
  "features": [
    {
      "name": "note_taking",
      "title": "Note Taking",
      "type": "editor",
      "premium": false,
      "enabled": true,
      "description": "Take and save notes",
      "placeholder": "Enter your notes...",
      "buttonLabel": "Save Note"
    },
    {
      "name": "pdf_export",
      "title": "PDF Export", 
      "type": "button",
      "premium": true,
      "enabled": true,
      "description": "Export as PDF",
      "label": "Export PDF"
    }
  ],
  "badge": {
    "enabled": true,
    "text": "",
    "color": "#2196F3"
  }
}
```

## 🔐 Security Features

### Row Level Security (RLS)
- Users can only access their own data
- Admin users have full access
- Real-time policy enforcement

### Authentication
- JWT tokens with expiration
- Rate limiting on login attempts
- Secure password hashing

### API Security
- Token validation on all protected routes
- Input validation and sanitization
- CORS configuration

## 📊 Available Features

### Built-in Features
1. **Note Taking** (Free)
   - Rich text editor
   - Auto-save functionality
   - Search and organize

2. **PDF Export** (Premium)
   - Export content as PDF
   - Custom formatting options
   - Download management

3. **Data Sync** (Free)
   - Cross-device synchronization
   - Backup and restore
   - Conflict resolution

4. **Custom Themes** (Premium)
   - Light/dark mode
   - Custom color schemes
   - UI customization

5. **Analytics** (Premium)
   - Usage statistics
   - Feature usage tracking
   - Performance metrics

### Adding New Features

#### 1. Database Setup
```sql
INSERT INTO features (name, title, type, premium, description)
VALUES ('my_feature', 'My Feature', 'button', false, 'Description');
```

#### 2. Server Implementation
```javascript
// website/app/api/run-feature/route.ts এ add করুন
async function executeMyFeature(action, input, user) {
  // Feature logic here
  return {
    success: true,
    output: 'Feature executed!',
    type: 'text'
  }
}
```

#### 3. Extension Configuration
```json
{
  "name": "my_feature",
  "title": "My Feature",
  "type": "button",
  "premium": false,
  "enabled": true
}
```

## 🔄 Development Workflow

### 1. Local Development
```bash
# Website
cd website && npm run dev

# Extension
# Chrome extensions reload manually
```

### 2. Testing
```bash
# Extension testing
# Load extension in Chrome developer mode

# API testing
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 3. Deployment

#### Website (Vercel)
```bash
npm run build
# Deploy to Vercel/Netlify
```

#### Extension (Chrome Store)
```bash
# Zip extension folder
# Submit to Chrome Web Store
```

## 🎛️ Admin Panel Features

### User Management
- View all users
- Manage subscriptions
- Activate/deactivate accounts
- View user activity

### Feature Configuration
- Enable/disable features
- Set premium requirements
- Update feature settings
- Deploy changes instantly

### Analytics Dashboard
- User statistics
- Feature usage metrics
- Performance monitoring
- Revenue tracking

### System Settings
- Global configuration
- API rate limits
- Maintenance mode
- Webhook management

## 🚨 Troubleshooting

### Common Issues

#### Extension না চালু হচ্ছে
```javascript
// Check browser console for errors
// Verify API URL in background.js
// Check network requests in DevTools
```

#### Authentication ব্যর্থ হচ্ছে
```javascript
// Verify Supabase credentials
// Check JWT secret configuration
// Validate user exists in database
```

#### Features কাজ করছে না
```javascript
// Check user subscription status
// Verify feature is enabled
// Review server logs for errors
```

### Debug Mode
```javascript
// Enable debug logging
localStorage.setItem('debug', 'true')
```

## 📈 Scaling Considerations

### Performance
- Database indexing
- API rate limiting
- CDN for static assets
- Caching strategies

### Security
- Regular security audits
- Token rotation
- Encryption at rest
- DDoS protection

### Monitoring
- Error tracking (Sentry)
- Performance monitoring
- User analytics
- Server health checks

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

### Code Style
- TypeScript for type safety
- ESLint configuration
- Prettier formatting
- Conventional commits

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- 📧 Email: support@yoursite.com
- 💬 Discord: [Join our server]
- 📖 Docs: [Documentation site]
- 🐛 Issues: [GitHub Issues]

---

**🎉 Congratulations!** You now have a fully functional server-controlled Chrome extension system. The extension is completely dynamic and controlled from your website - no more extension updates needed for changes!

আপনার extension এখন সম্পূর্ণ server-controlled এবং dynamic। সব features, UI, এবং configurations আপনার website থেকে control হবে। যেকোনো পরিবর্তন extension update ছাড়াই সাথে সাথে apply হবে! 🚀
