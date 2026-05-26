// Monitor incoming captions
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3100,
  path: '/api/caption/history',
  method: 'GET',
  headers: {
    'x-api-key': 'localSecretKey'
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
      console.log('\n📋 CAPTION HISTORY:\n');
      console.log(`Total captions received: ${result.total}\n`);
      
      if (result.captions.length === 0) {
        console.log('⚠️  No captions received yet.');
        console.log('Make sure:');
        console.log('  1. Extension is enabled in chrome://extensions/');
        console.log('  2. Extension is reloaded');
        console.log('  3. You\'re on a Teams call with captions enabled');
      } else {
        result.captions.forEach((cap, i) => {
          console.log(`${i + 1}. [${cap.timestamp}] ${cap.text}`);
        });
      }
    } catch (e) {
      console.error('Error parsing response:', e);
    }
  });
});

req.on('error', (e) => {
  console.error(`Connection error: ${e.message}`);
  process.exit(1);
});

req.end();
