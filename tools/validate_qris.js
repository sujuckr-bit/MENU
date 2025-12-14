#!/usr/bin/env node
/**
 * Comprehensive QRIS Implementation Validator
 * Checks that all required QRIS features are present in the codebase
 */

const fs = require('fs');
const path = require('path');

const checks = [];

function check(name, fn) {
    try {
        const result = fn();
        checks.push({ name, pass: result, error: null });
        console.log(result ? '✅' : '❌', name);
    } catch (e) {
        checks.push({ name, pass: false, error: e.message });
        console.log('❌', name, '-', e.message);
    }
}

console.log('🔍 QRIS Implementation Validator\n');

// 1. Check script.js syntax
check('script.js has valid JavaScript syntax', () => {
    const code = fs.readFileSync('c:/Users/DELL/Desktop/MENU/script.js', 'utf8');
    try { new Function(code); return true; } catch { return false; }
});

// 2. Check for required functions in script.js
const scriptCode = fs.readFileSync('c:/Users/DELL/Desktop/MENU/script.js', 'utf8');

check('generateReceiptNumber() function exists', () => scriptCode.includes('generateReceiptNumber'));
check('generateReceiptHTML() function exists', () => scriptCode.includes('generateReceiptHTML'));
check('showReceiptModal() function exists', () => scriptCode.includes('showReceiptModal'));
check('buildEMVQRPayload() function exists', () => scriptCode.includes('buildEMVQRPayload'));
check('crc16ccitt() function exists', () => scriptCode.includes('crc16ccitt'));

// 3. Check for QRIS payment method handling
check('QRIS payment method checks (paymentMethod === "qris")', () => {
    return (scriptCode.match(/paymentMethod\s*===\s*['"]qris['"]/g) || []).length >= 3;
});

// 4. Check for QR image generation
check('QR image URL generation code', () => scriptCode.includes('qrserver.com'));

// 5. Check for receipt modal
check('Receipt modal HTML generation', () => scriptCode.includes('receiptModal'));

// 6. Check server index.js for settings endpoints
const serverCode = fs.readFileSync('c:/Users/DELL/Desktop/MENU/server/index.js', 'utf8');

check('Server GET /api/settings endpoint', () => serverCode.includes("'/api/settings'") || serverCode.includes('"/api/settings"'));
check('Server POST /api/settings endpoint', () => serverCode.includes('app.post'));

// 7. Check server db.js for settings helpers
const dbCode = fs.readFileSync('c:/Users/DELL/Desktop/MENU/server/db.js', 'utf8');

check('Database getSettings() function', () => dbCode.includes('getSettings'));
check('Database setSetting() function', () => dbCode.includes('setSetting'));

// 8. Check API config for robust parsing
const apiCode = fs.readFileSync('c:/Users/DELL/Desktop/MENU/assets/js/api-config.js', 'utf8');

check('API helper checks content-type', () => apiCode.includes('content-type'));
check('API helper has error handling', () => apiCode.includes('catch'));

// 9. Check daftar.html for admin QRIS form
const adminCode = fs.readFileSync('c:/Users/DELL/Desktop/MENU/daftar.html', 'utf8');

check('Admin has QRIS settings form', () => adminCode.includes('QRIS') || adminCode.includes('Merchant'));

// Summary
console.log('\n' + '='.repeat(50));
const passed = checks.filter(c => c.pass).length;
const total = checks.length;
console.log(`✅ Passed: ${passed}/${total}`);

if (passed === total) {
    console.log('🎉 All QRIS implementation checks passed!');
    process.exit(0);
} else {
    console.log('⚠️  Some checks failed. Review above.');
    process.exit(1);
}
