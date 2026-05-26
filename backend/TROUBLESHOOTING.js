#!/usr/bin/env node
/**
 * TROUBLESHOOTING GUIDE - Why aren't captions showing up?
 */

const http = require('http');

console.clear();
console.log(`
╔═══════════════════════════════════════════════════════════════╗
║        🔍 TEAMS CAPTION SYSTEM - TROUBLESHOOTING GUIDE        ║
╚═══════════════════════════════════════════════════════════════╝

Follow these steps to get live captions working:

📋 CHECKLIST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

☑️  STEP 1: Verify Backend is Running
─────────────────────────────────────────────────────────────
Terminal 1:
  $ cd backend
  $ node server.js
  
Expected output:
  [INFO] Server running on http://localhost:3100

☑️  STEP 2: Verify Live Monitor is Running  
─────────────────────────────────────────────────────────────
Terminal 2:
  $ cd backend
  $ node live-monitor.js
  
Expected output:
  🎬 TEAMS CAPTION LIVE VIEWER
  ━━━━━━━━━━━━━━━━━━━━━━
  Listening for live captions from Teams...
  ⏳ Waiting... (10:30:45 AM)

☑️  STEP 3: Test Backend Connection
─────────────────────────────────────────────────────────────
Terminal 3:
  $ cd backend
  $ node test-caption.js "Test message"
  
Expected output:
  ✅ Caption sent successfully!
  
This should appear in Terminal 2 (live-monitor):
  📢 [10:30:45 AM]
     Test message

☑️  STEP 4: Load/Reload the Chrome Extension
─────────────────────────────────────────────────────────────
1. Open Chrome and go to: chrome://extensions/
2. Enable "Developer mode" (toggle in top-right)
3. Find "Teams Caption Sender" extension
4. Click the "Reload" button (circular arrow icon)

Expected: Extension should be ENABLED (toggle is ON)

☑️  STEP 5: Verify Extension Configuration  
─────────────────────────────────────────────────────────────
The extension should be configured to send to: http://localhost:3100

If you changed the port, verify in:
  team-captions/content.js

Line should say:
  const SERVER_URL = "http://localhost:3100/api/caption";

☑️  STEP 6: Join a Teams Call
─────────────────────────────────────────────────────────────
1. Go to: https://teams.microsoft.com
2. Join a Teams call or start a meeting
3. Make sure captions are enabled:
   - Click "..." (More options)
   - Select "Turn on captions"
4. Wait for someone to speak (captions need audio to appear)

☑️  STEP 7: Watch for Captions
─────────────────────────────────────────────────────────────
As people speak in the Teams call, captions should appear in:
  Terminal 2 (live-monitor) in real-time

🐛 DEBUGGING - If captions still aren't showing:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Problem: Backend receives test caption but not Teams captions
Solution:
  1. Open Chrome DevTools: F12 or Ctrl+Shift+I
  2. Go to "Console" tab
  3. Look for "[Teams Caption Sender]" logs
  4. Check for errors in red
  5. Verify you're on https://teams.microsoft.com

Problem: Extension not loading at all
Solution:
  1. Check chrome://extensions/ has the extension listed
  2. Verify the extension is ENABLED (toggle is ON)
  3. Check for error message on the extension card
  4. Try reloading the extension

Problem: Can't find captions in Teams
Solution:
  1. Captions only show during active calls
  2. Someone needs to be speaking
  3. Captions must be enabled in Teams settings
  4. Some Teams calls may not have real-time captions available

Problem: Port 3100 already in use
Solution:
  1. Find process: netstat -ano | grep 3100
  2. Kill process: taskkill /PID <PID> /F
  3. Or change PORT in backend/.env

📞 API ENDPOINTS FOR TESTING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Send a caption:
  curl -X POST http://localhost:3100/api/caption \\
    -H "Content-Type: application/json" \\
    -H "x-api-key: localSecretKey" \\
    -d '{"text":"Test caption"}'

Get caption history:
  curl http://localhost:3100/api/caption/history \\
    -H "x-api-key: localSecretKey"

Clear history:
  curl -X DELETE http://localhost:3100/api/caption/history \\
    -H "x-api-key: localSecretKey"

🎯 QUICK TEST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run this to test the entire system at once:

  Terminal 1: cd backend && node server.js
  Terminal 2: cd backend && node live-monitor.js
  Terminal 3: cd backend && node test-caption.js "Hello"

If you see "Hello" appear in Terminal 2, the system works!
Then reload the extension and join a Teams call.

💡 TIPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Always reload the extension after changing code
- Captions work best on desktop Microsoft Teams
- Some networks may block localhost connections
- Check console logs (F12) for real-time debugging info
- The extension needs permissions for https://teams.microsoft.com

`);
