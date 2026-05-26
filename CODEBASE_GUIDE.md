# Teams Caption Live Viewer - Complete Guide

## 🎯 Project Overview

This project captures live captions from Microsoft Teams in the browser and displays them in your terminal in real-time.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Microsoft Teams (Browser)                                   │
│  └─ Caption DOM: [data-tid="closed-caption-text"]          │
└────────────┬────────────────────────────────────────────────┘
             │
             │ (Browser Extension monitors captions)
             │ team-captions/
             │ - content.js: Extracts captions from Teams DOM
             │ - background.js: Service worker
             │ - manifest.json: Extension config
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Node.js Backend (http://localhost:3001)                     │
│  ├─ server.js: Express server                              │
│  ├─ src/controllers/captionController.js: Processes input  │
│  ├─ src/routes/captionRoutes.js: API routes               │
│  ├─ src/utils/logger.js: Logging utility                   │
│  └─ src/config/config.js: Configuration                    │
└────────────┬────────────────────────────────────────────────┘
             │
             │ (Backend stores captions in memory)
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Terminal Monitoring                                         │
│  ├─ monitor.js: Shows caption history (snapshot)           │
│  └─ live-monitor.js: Real-time live caption viewer ✨      │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### 1. Start the Backend Server

```bash
cd backend
npm install  # if not done yet
node server.js
```

You should see:
```
[INFO] timestamp: Server running on http://localhost:3001
```

### 2. Load the Browser Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `team-captions/` folder
5. The extension will appear in your extensions list

### 3. View Live Captions in Terminal (Choose One)

#### Option A: Real-Time Live Viewer (RECOMMENDED ✨)
```bash
cd backend
node live-monitor.js
```

This shows captions **in real-time** as they arrive:
```
🎬 TEAMS CAPTION LIVE VIEWER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Listening for live captions from Teams...

📢 [10:30:45 AM]
   Hello, can you hear me?

📢 [10:30:47 AM]
   This is a test caption
```

#### Option B: View Caption History (One-Time)
```bash
cd backend
node monitor.js
```

Shows all captions received so far (snapshot, not live).

## 📁 File Structure & Responsibilities

### Backend

| File | Purpose |
|------|---------|
| `server.js` | Main Express server, sets up routes & middleware |
| `src/config/config.js` | Configuration (port, API keys, env vars) |
| `src/controllers/captionController.js` | Handles caption processing & storage |
| `src/routes/captionRoutes.js` | Defines API endpoints |
| `src/middleware/auth.js` | API key validation |
| `src/utils/logger.js` | Logging utility with levels |
| `debug.js` | Debug helper (if needed) |
| `monitor.js` | One-time history viewer |
| `live-monitor.js` | Real-time caption viewer ✨ |

### Browser Extension

| File | Purpose |
|------|---------|
| `team-captions/manifest.json` | Extension metadata & permissions |
| `team-captions/content.js` | Runs on teams.microsoft.com, extracts captions |
| `team-captions/background.js` | Service worker (background task) |

## 🔄 Data Flow

1. **Browser**: Teams call with captions enabled
2. **Extension (content.js)**:
   - Watches DOM with `MutationObserver` (monitors changes)
   - Polls every 400ms for changes
   - Finds captions using: `document.querySelectorAll('[data-tid="closed-caption-text"]')`
   - Sends to backend: `POST http://localhost:3001/api/caption`
   
3. **Backend (captionController.js)**:
   - Receives POST with `{ text: "caption text" }`
   - Logs to terminal with timestamp
   - Stores in-memory history (max 100 captions)
   - Generates response
   - Plays audio via TTS (Text-to-Speech)
   
4. **Terminal**:
   - `live-monitor.js` polls `/api/caption/history` every 500ms
   - Displays new captions immediately

## 🔧 API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/caption` | Send a new caption |
| `GET` | `/api/caption/history` | Get all captions (last 100) |
| `DELETE` | `/api/caption/history` | Clear caption history |

### Example: Send Caption (from extension)
```json
POST /api/caption
{
  "text": "Hello, this is a caption"
}
Headers: x-api-key: localSecretKey
```

### Example: Get History
```json
GET /api/caption/history
Headers: x-api-key: localSecretKey

Response:
{
  "total": 5,
  "captions": [
    {
      "text": "Hello, this is a caption",
      "timestamp": "2026-05-26T10:30:45.123Z"
    },
    ...
  ]
}
```

## 🎬 How to Use

### Scenario: Attend Teams Call and See Live Captions

1. **Terminal 1**: Start backend
   ```bash
   cd backend && node server.js
   ```

2. **Terminal 2**: Start live monitor
   ```bash
   cd backend && node live-monitor.js
   ```

3. **Browser**: 
   - Join a Teams call
   - Make sure captions are enabled (default or turn on)
   - Speak or wait for others to speak
   - See captions appear in Terminal 2 in real-time! 📢

### Debugging

| Issue | Solution |
|-------|----------|
| No captions showing | Check extension is enabled & reloaded at `chrome://extensions/` |
| "Connection error" | Make sure backend is running: `node server.js` |
| Blank terminal | Captions arriving but not yet displayed; wait for next caption |
| Old captions not clearing | Captions are kept in memory; clear with: `curl -X DELETE http://localhost:3001/api/caption/history -H "x-api-key: localSecretKey"` |

## 🔐 Security Notes

- API Key: `localSecretKey` (local development only)
- CORS enabled for all origins
- Extension only targets `teams.microsoft.com`

## 📝 Configuration

Edit `backend/src/config/config.js` to customize:
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging detail (error, warn, info, debug)

## 🚢 Deployment Notes

Before production:
- Change API key from `localSecretKey`
- Update `team-captions/content.js` SERVER_URL
- Add authentication/validation
- Use a proper database instead of in-memory history
- Enable HTTPS
- Restrict CORS origins

## 💡 Next Steps

- Add AI/ML caption processing in `generateResponse()`
- Store captions in a database (MongoDB, PostgreSQL)
- Add caption filtering/searching
- Export captions to file
- Add subtitle generation
- Integrate with accessibility tools
