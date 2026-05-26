#!/usr/bin/env node
/**
 * Test script to send a sample caption to the backend
 * Usage: node test-caption.js "Your caption text here"
 */

const http = require('http');

const captionText = process.argv[2] || 'Test caption from terminal';

const postData = JSON.stringify({
  text: captionText
});

const options = {
  hostname: 'localhost',
  port: 3100,
  path: '/api/caption',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'x-api-key': 'localSecretKey'
  }
};

console.log(`\n📤 Sending caption to backend on port 3100...`);
console.log(`📝 Text: "${captionText}"\n`);

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ Response from backend:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('\n✅ Caption sent successfully!');
        console.log('💡 Check your live-monitor terminal - the caption should appear there.');
      }
    } catch (e) {
      console.error('Error parsing response:', e);
    }
  });
});

req.on('error', (e) => {
  console.error(`\n❌ Connection error: ${e.message}`);
  console.error('\n⚠️  Make sure the backend server is running:');
  console.error('   cd backend && node server.js\n');
  process.exit(1);
});

req.write(postData);
req.end();
