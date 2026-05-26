// Quick debugging script to test the API
const http = require('http');

const data = JSON.stringify({
  text: "Test caption from debug script"
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/caption',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'x-api-key': 'localSecretKey'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('RESPONSE:', responseData);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();

console.log('Debug request sent to http://localhost:3001/api/caption');
