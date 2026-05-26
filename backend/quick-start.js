#!/usr/bin/env node
/**
 * Quick Start Script - Run everything needed
 * Usage: node quick-start.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.clear();
console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║    🎬 TEAMS CAPTION LIVE VIEWER - QUICK START         ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Check if backend dependencies are installed
const backendPath = path.join(__dirname, 'package.json');
if (!fs.existsSync(backendPath)) {
  console.error('❌ Backend package.json not found!');
  process.exit(1);
}

console.log('✅ Starting Teams Caption Backend Server...\n');

// Start the backend server
const server = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// Wait a moment, then start the live monitor
setTimeout(() => {
  console.log('\n✅ Backend started. Starting Live Caption Monitor...\n');
  
  const monitor = spawn('node', ['live-monitor.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  monitor.on('close', (code) => {
    console.log('\n👋 Monitor closed');
    server.kill();
    process.exit(code);
  });
}, 1500);

server.on('close', (code) => {
  console.log('\n👋 Server stopped');
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping all processes...');
  server.kill();
  process.exit(0);
});
