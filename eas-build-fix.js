#!/usr/bin/env node

/**
 * EAS Build Fix Script
 * Helps diagnose and fix EAS build issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 EAS Build Fix Script');
console.log('========================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Not in project root directory');
  console.error('Please run this script from your Expo project root');
  process.exit(1);
}

// Check EAS configuration
console.log('📋 Checking EAS configuration...');

if (!fs.existsSync('eas.json')) {
  console.log('❌ eas.json not found, creating default configuration...');

  const easJson = {
    "build": {
      "development": {
        "android": {
          "buildType": "apk",
          "gradleCommand": ":app:assembleDebug"
        },
        "ios": {
          "buildType": "development"
        }
      },
      "preview": {
        "android": {
          "buildType": "apk"
        }
      },
      "production": {
        "android": {
          "buildType": "aab"
        }
      }
    }
  };

  fs.writeFileSync('eas.json', JSON.stringify(easJson, null, 2));
  console.log('✅ Created eas.json with default configuration');
} else {
  console.log('✅ eas.json found');
}

// Check app.json for Android configuration
console.log('\n📱 Checking app.json configuration...');

if (fs.existsSync('app.json')) {
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));

  if (!appJson.expo.android) {
    appJson.expo.android = {};
  }

  // Ensure proper Android configuration
  if (!appJson.expo.android.package) {
    appJson.expo.android.package = "com.rankbooktech.sdmapp";
    console.log('✅ Added Android package name');
  }

  if (!appJson.expo.android.versionCode) {
    appJson.expo.android.versionCode = 1;
    console.log('✅ Added Android versionCode');
  }

  fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2));
  console.log('✅ Updated app.json configuration');
}

// Check for problematic dependencies
console.log('\n📦 Checking for problematic dependencies...');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

const problematicDeps = [
  'react-native-razorpay', // This might cause issues in EAS
  'react-native-webview', // Might have conflicts
];

let hasProblematicDeps = false;
problematicDeps.forEach(dep => {
  if (dependencies[dep]) {
    console.log(`⚠️  Found potentially problematic dependency: ${dep}@${dependencies[dep]}`);
    hasProblematicDeps = true;
  }
});

if (hasProblematicDeps) {
  console.log('\n💡 For EAS builds, consider using Expo-managed alternatives:');
  console.log('   - Use @stripe/stripe-react-native instead of react-native-razorpay');
  console.log('   - Use Expo WebBrowser for external links');
}

// Check Android native code
console.log('\n🤖 Checking Android native configuration...');

const androidManifestPath = 'android/app/src/main/AndroidManifest.xml';
if (fs.existsSync(androidManifestPath)) {
  const manifest = fs.readFileSync(androidManifestPath, 'utf8');

  // Check for internet permission
  if (!manifest.includes('android.permission.INTERNET')) {
    console.log('⚠️  AndroidManifest.xml missing INTERNET permission');
    console.log('   This might cause network-related build failures');
  } else {
    console.log('✅ AndroidManifest.xml has INTERNET permission');
  }
}

// Check Gradle configuration
console.log('\n🔧 Checking Gradle configuration...');

const gradlePropertiesPath = 'android/gradle.properties';
if (fs.existsSync(gradlePropertiesPath)) {
  const gradleProps = fs.readFileSync(gradlePropertiesPath, 'utf8');

  if (!gradleProps.includes('org.gradle.jvmargs')) {
    console.log('⚠️  Gradle JVM args not configured');
    console.log('   This might cause memory-related build failures');
  } else {
    console.log('✅ Gradle JVM args configured');
  }
} else {
  console.log('⚠️  android/gradle.properties not found');
}

// Provide recommendations
console.log('\n🚀 EAS Build Recommendations:');
console.log('==============================');

console.log('\n1. 🔍 Check Build Logs:');
console.log('   Visit: https://expo.dev/accounts/YOUR_ACCOUNT/projects/YOUR_PROJECT/builds/LATEST_BUILD');
console.log('   Look for the "Run gradlew" phase errors');

console.log('\n2. 🧹 Clear Build Cache:');
console.log('   eas build --platform android --profile development --clear-cache');

console.log('\n3. 📋 Environment Variables:');
console.log('   Make sure all required env vars are set in EAS dashboard');

console.log('\n4. 🔧 Alternative Build Command:');
console.log('   eas build --platform android --profile development --no-wait');

console.log('\n5. 📱 Test Locally First:');
console.log('   Fix Java 17 issue, then test: npx expo run:android');

console.log('\n6. 💡 If Razorpay causes issues:');
console.log('   - Temporarily remove react-native-razorpay from dependencies');
console.log('   - Build without it first');
console.log('   - Add back after confirming basic build works');

console.log('\n📞 For persistent issues:');
console.log('   - Check Expo Discord #eas channel');
console.log('   - Review Expo documentation: https://docs.expo.dev/build-reference/troubleshooting/');

console.log('\n✅ EAS Build fix script completed!');
console.log('   Run: eas build --platform android --profile development --clear-cache');