# Chrome Extension ব্যবহারের সম্পূর্ণ গাইড

## ১. Extension Install করুন

### Chrome এ Extension Load করা:
1. Chrome browser খুলুন এবং `chrome://extensions/` এ যান
2. উপরের ডানদিকে "Developer mode" enable করুন
3. "Load unpacked" বাটনে click করুন
4. `chrome-extension` ফোল্ডারটি select করুন
5. Extension আপনার toolbar এ appear করবে

## ২. Server/Website Setup

### আপনার Website/Server এ এই API Endpoints তৈরি করুন:

\`\`\`javascript
// Authentication endpoint
POST /api/verify-token
{
  "token": "user_auth_token"
}
Response: { "valid": true, "user": {...} }

// UI Configuration endpoint  
GET /api/ui-config
Response: {
  "features": [
    {
      "id": "scrape_phones",
      "title": "Phone Numbers Scrape করুন",
      "description": "Current page থেকে phone numbers extract করুন",
      "type": "action",
      "premium": false
    }
  ]
}

// Feature execution endpoint
POST /api/execute-feature
{
  "feature_id": "scrape_phones",
  "user_token": "...",
  "data": {...}
}

// Phone data receive endpoint
POST /api/phone-data
{
  "phones": ["123-456-7890", ...],
  "source_url": "https://example.com",
  "user_token": "..."
}
\`\`\`

## ৩. Extension Configuration

### Extension এর code এ আপনার domain update করুন:

**popup.js এবং background.js এ:**
\`\`\`javascript
const SERVER_URL = 'https://your-domain.com/api';
\`\`\`

**manifest.json এ:**
\`\`\`json
{
  "host_permissions": [
    "https://your-actual-domain.com/*"
  ]
}
\`\`\`

## ৪. Database Setup (Optional)

যদি আপনি Supabase ব্যবহার করতে চান:
1. `scripts` ফোল্ডারের SQL files run করুন
2. আপনার website এ Supabase client setup করুন
3. User authentication implement করুন

## ৫. Testing Process

### Local Testing:
1. Extension install করুন
2. আপনার server locally run করুন
3. Extension icon এ click করুন
4. Authentication check করুন
5. Phone scraping test করুন

### Production Deployment:
1. আপনার server live deploy করুন
2. Extension এ production URL update করুন
3. Chrome Web Store এ extension submit করুন (optional)

## ৬. User Experience Flow

1. **User Extension Click করে** → Authentication check হয়
2. **Authenticated হলে** → Server থেকে UI config load হয়
3. **Feature Click করলে** → Server API call হয়
4. **Complex Operations** → Website এ redirect হয়
5. **Phone Scraping** → Content script data extract করে server এ পাঠায়

## ৭. Advantages

- **Lightweight Extension**: Chrome Web Store approval সহজ
- **Server Control**: আপনার website থেকে সব control করতে পারবেন
- **Real-time Updates**: Extension update ছাড়াই features change করতে পারবেন
- **Better Security**: Sensitive data server এ থাকবে
- **Scalable**: Server side scaling সহজ

## ৮. Support & Maintenance

- Extension এ শুধু bug fixes এর জন্য update লাগবে
- নতুন features আপনার server এ add করলেই হবে
- UI changes server configuration দিয়ে করতে পারবেন
- User data সব আপনার control এ থাকবে

এই approach এ আপনি extension এর minimal code maintain করবেন এবং সব powerful features আপনার website/server থেকে control করবেন।
