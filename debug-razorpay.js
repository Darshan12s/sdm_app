#!/usr/bin/env node

/**
 * Razorpay SDK Debug Script
 * Run this to diagnose Razorpay SDK issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Razorpay SDK Debug Script');
console.log('==============================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Not in project root directory');
  console.error('Please run this script from your Expo project root');
  process.exit(1);
}

// Check package.json for SDK
console.log('📦 Checking SDK installation...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const sdkVersion = packageJson.dependencies['react-native-razorpay'];

  if (sdkVersion) {
    console.log(`✅ react-native-razorpay found: ${sdkVersion}`);
  } else {
    console.log('❌ react-native-razorpay not found in dependencies');
    console.log('Installing...');
    execSync('npx expo install react-native-razorpay', { stdio: 'inherit' });
  }
} catch (error) {
  console.error('❌ Error reading package.json:', error.message);
}

// Check environment variables
console.log('\n🔑 Checking environment variables...');
const envPath = '.env';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasRazorpayKey = envContent.includes('EXPO_PUBLIC_RAZORPAY_KEY_ID');

  if (hasRazorpayKey) {
    console.log('✅ EXPO_PUBLIC_RAZORPAY_KEY_ID found in .env');
  } else {
    console.log('❌ EXPO_PUBLIC_RAZORPAY_KEY_ID not found in .env');
    console.log('Please add: EXPO_PUBLIC_RAZORPAY_KEY_ID=your_key_here');
  }
} else {
  console.log('❌ .env file not found');
}

// Clear caches
console.log('\n🧹 Clearing caches...');
try {
  if (fs.existsSync('node_modules/.cache')) {
    fs.rmSync('node_modules/.cache', { recursive: true, force: true });
    console.log('✅ Cleared node_modules/.cache');
  }

  if (fs.existsSync('.expo')) {
    fs.rmSync('.expo', { recursive: true, force: true });
    console.log('✅ Cleared .expo cache');
  }

  // Clear Metro cache
  if (fs.existsSync('.metro-cache')) {
    fs.rmSync('.metro-cache', { recursive: true, force: true });
    console.log('✅ Cleared Metro cache');
  }
} catch (error) {
  console.log('⚠️ Some cache clearing failed:', error.message);
}

console.log('\n🚀 Next Steps:');
console.log('1. Run development build:');
console.log('   npx expo run:android    # for Android');
console.log('   npx expo run:ios        # for iOS');
console.log('');
console.log('2. Test SDK in your app using PaymentSDKTest component');
console.log('');
console.log('3. If still failing, check RAZORPAY_DEBUG_GUIDE.md for more solutions');

console.log('\n📱 Remember:');
console.log('• NEVER use Expo Go app for native modules');
console.log('• Always use development builds (npx expo run:android/ios)');
console.log('• SDK requires native compilation');

console.log('\n✅ Debug script completed!');