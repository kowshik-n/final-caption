// Real-time caption viewer
const http = require('http');
const logger = require('./src/utils/logger');

let lastCount = 0;
let previousCaptions = new Set();

const API_KEY = 'localSecretKey';

console.clear();
console.log('\n🎬 TEAMS CAPTION LIVE VIEWER');
console.log('━'.repeat(60));
console.log('Listening for live captions from Teams...\n');

function fetchCaptions() {
  const options = {
    hostname: 'localhost',
    port: 3100,
    path: '/api/caption/history',
    method: 'GET',
    headers: {
      'x-api-key': API_KEY
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        const captions = result.captions || [];
        
        // Check for new captions
        if (captions.length > lastCount) {
          const newCaptions = captions.slice(lastCount);
          
          newCaptions.forEach((caption, index) => {
            const captionKey = `${caption.timestamp}:${caption.text}`;
            
            if (!previousCaptions.has(captionKey)) {
              previousCaptions.add(captionKey);
              
              // Extract time from ISO timestamp
              const time = new Date(caption.timestamp).toLocaleTimeString();
              
              // Display with visual formatting
              console.log(`\n📢 [${time}]`);
              console.log(`   ${caption.text}`);
              console.log('');
            }
          });
          
          lastCount = captions.length;
        }
        
        // Show status
        if (captions.length === 0 && lastCount === 0) {
          process.stdout.write(`\r⏳ Waiting... (${new Date().toLocaleTimeString()})`);
        }
      } catch (e) {
        console.error('Error parsing response:', e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`\n❌ Connection error: ${e.message}`);
    console.error('Make sure the backend server is running: node server.js');
    process.exit(1);
  });

  req.end();
}

// Poll for captions every 500ms
setInterval(fetchCaptions, 500);

// Initial fetch
fetchCaptions();

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Live monitor stopped.');
  process.exit(0);
});
