#!/usr/bin/env node
/**
 * Cross-platform script to kill processes on a specific port
 * Usage: node scripts/kill-port.js [port]
 */

const port = process.argv[2] || '5000';
const { execSync } = require('child_process');
const os = require('os');

console.log(`🔍 Checking for processes on port ${port}...`);

try {
  const currentPlatform = os.platform();
  if (currentPlatform === 'win32') {
    // Windows: Use netstat and taskkill
    let netstatOutput;
    try {
      netstatOutput = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
    } catch (e) {
      // netstat/findstr returns non-zero if no matches found
      console.log(`✓ Port ${port} is available`);
      process.exit(0);
    }
    
    const lines = netstatOutput.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      console.log(`✓ Port ${port} is available`);
      process.exit(0);
    }
    
    const pids = new Set();
    lines.forEach(line => {
      const match = line.match(/\s+(\d+)\s*$/);
      if (match) {
        pids.add(match[1]);
      }
    });
    
    if (pids.size === 0) {
      console.log(`✓ Port ${port} is available`);
      process.exit(0);
    }
    
    console.log(`⚠️  Found ${pids.size} process(es) using port ${port}`);
    pids.forEach(pid => {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`   ✓ Killed PID ${pid}`);
      } catch (e) {
        console.log(`   ✗ Failed to kill PID ${pid}`);
      }
    });
    
    console.log(`✓ Port ${port} is now free`);
  } else {
    // Unix/Linux/Mac: Use lsof and kill
    try {
      const lsofOutput = execSync(`lsof -ti:${port}`, { encoding: 'utf-8' });
      const pids = lsofOutput.trim().split('\n').filter(pid => pid.trim());
      
      if (pids.length === 0) {
        console.log(`✓ Port ${port} is available`);
        process.exit(0);
      }
      
      console.log(`⚠️  Found ${pids.length} process(es) using port ${port}`);
      pids.forEach(pid => {
        try {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
          console.log(`   ✓ Killed PID ${pid}`);
        } catch (e) {
          console.log(`   ✗ Failed to kill PID ${pid}`);
        }
      });
      
      console.log(`✓ Port ${port} is now free`);
    } catch (e) {
      // lsof returns non-zero if no processes found
      console.log(`✓ Port ${port} is available`);
    }
  }
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}
