#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting BiHortus Development Environment');
console.log('===========================================\n');

// Carica environment
require('dotenv').config();

// Avvia server backend
console.log('📊 Starting backend server...');
const serverProcess = spawn('node', ['src/api/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: __dirname
});

serverProcess.stdout.on('data', (data) => {
  console.log(`[SERVER] ${data.toString().trim()}`);
});

serverProcess.stderr.on('data', (data) => {
  console.error(`[SERVER ERROR] ${data.toString().trim()}`);
});

// Avvia client frontend (dopo 3 secondi)
setTimeout(() => {
  console.log('\n🌐 Starting frontend client...');
  const clientProcess = spawn('npm', ['run', 'client'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname,
    shell: true
  });

  clientProcess.stdout.on('data', (data) => {
    console.log(`[CLIENT] ${data.toString().trim()}`);
  });

  clientProcess.stderr.on('data', (data) => {
    console.error(`[CLIENT ERROR] ${data.toString().trim()}`);
  });

  // Gestione shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down BiHortus...');
    serverProcess.kill();
    clientProcess.kill();
    process.exit(0);
  });

}, 3000);

console.log('\n📋 Available endpoints:');
console.log(`   Frontend: http://localhost:${process.env.CLIENT_PORT || 3000}`);
console.log(`   Backend:  http://localhost:${process.env.PORT || 5000}`);
console.log(`   Health:   http://localhost:${process.env.PORT || 5000}/api/health`);
console.log('\n⏹️  Press Ctrl+C to stop\n');