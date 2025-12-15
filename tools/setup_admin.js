#!/usr/bin/env node

/**
 * Setup Admin Password Script
 * Usage: TEST_ADMIN_PASSWORD=YourPassword node tools/setup_admin.js
 * 
 * Creates or updates admin account with bcrypt hashed password
 */

const adminPassword = process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

if (!adminPassword) {
  console.error('\n❌ ERROR: TEST_ADMIN_PASSWORD or ADMIN_PASSWORD env var not set');
  console.error('\nUsage Examples:');
  console.error('  PowerShell: $env:TEST_ADMIN_PASSWORD = "YourPassword"; node tools\\setup_admin.js');
  console.error('  Cmd.exe:    set TEST_ADMIN_PASSWORD=YourPassword && node tools\\setup_admin.js');
  console.error('  Bash:       TEST_ADMIN_PASSWORD=YourPassword node tools/setup_admin.js');
  console.error('\n⚠️  Password Requirements:');
  console.error('  - Minimum 8 characters');
  console.error('  - Mix of uppercase, lowercase, numbers, and special characters recommended');
  console.error('  - Do not use "admin123" or other default/weak passwords\n');
  process.exit(1);
}

const path = require('path');

// Setup paths
const serverDir = path.join(__dirname, '..', 'server');
const nodeModulesDir = path.join(serverDir, 'node_modules');

// Add server node_modules to module search path
module.paths.unshift(nodeModulesDir);

// Import database and bcrypt
const db = require(path.join(serverDir, 'db.js'));
const bcrypt = require('bcryptjs');

async function setupAdmin() {
  try {
    console.log('\n🔧 Setting up Admin Account...\n');

    // Initialize database
    db.init();
    console.log('✓ Database initialized');

    // Hash the password
    console.log('✓ Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // Set admin password
    db.setUserPassword('admin', passwordHash);
    console.log('✓ Admin password updated in database');

    // Verify it was saved
    const user = db.getUser('admin');
    if (user && user.passwordHash) {
      console.log('\n✅ SUCCESS: Admin account ready!\n');
      console.log('📋 Admin Details:');
      console.log('   Username: admin');
      console.log('   Password: ••••••••• (set via env var)');
      console.log('   Hash: ' + user.passwordHash.substring(0, 20) + '...\n');
      console.log('🌐 Login URL: http://localhost:8000/admin-login.html\n');
      return 0;
    } else {
      throw new Error('Password was not saved correctly');
    }
  } catch (error) {
    console.error('\n❌ ERROR: ' + error.message + '\n');
    return 1;
  }
}

setupAdmin()
  .then(code => process.exit(code))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
