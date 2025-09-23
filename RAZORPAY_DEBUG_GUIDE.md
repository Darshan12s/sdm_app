# 🔧 Razorpay SDK Debug Guide

## 🚨 **FIXING: "Cannot read property 'open' of null"**

This error occurs when the Razorpay SDK is not properly linked or you're running in Expo Go instead of a development build.

## 📋 **QUICK FIX CHECKLIST**

### **Step 1: Verify You're Using Development Build**
```bash
# ❌ DON'T use Expo Go app
# ✅ Use development build instead

# Create development build
npx expo run:android  # for Android
npx expo run:ios     # for iOS
```

### **Step 2: Check SDK Installation**
```bash
# Verify SDK is installed
npm list react-native-razorpay

# Should show: react-native-razorpay@x.x.x
```

### **Step 3: Clear Metro Cache**
```bash
# Clear all caches
npx expo start --clear

# Or manually clear
rm -rf node_modules/.cache
rm -rf .expo
```

### **Step 4: Rebuild Native Code**
```bash
# For Android
npx expo run:android --no-build-cache

# For iOS
npx expo run:ios --no-build-cache
```

## 🔍 **DIAGNOSTIC STEPS**

### **1. Test SDK Availability**
```javascript
import { RazorpaySDKService } from './src/services/payment/razorpay-sdk';

// Run this test
const result = await RazorpaySDKService.testSDKIntegration();
console.log('SDK Test Result:', result);
```

### **2. Check Console Logs**
Look for these messages:
- ✅ `"Razorpay SDK integration test passed"`
- ❌ `"RazorpayCheckout is null or undefined"`
- ❌ `"RazorpayCheckout.open is not a function"`

### **3. Verify Environment Variables**
```javascript
// Check .env file
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXX

// Verify in code
console.log('API Key:', process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID);
```

## 🛠️ **TROUBLESHOOTING BY ERROR TYPE**

### **Error: "Cannot read property 'open' of null"**

**Cause:** SDK not linked or Expo Go being used

**Solutions:**
1. **Switch to Development Build:**
   ```bash
   npx expo run:android
   # or
   npx expo run:ios
   ```

2. **Clear and Rebuild:**
   ```bash
   npx expo start --clear
   npx expo run:android --no-build-cache
   ```

3. **Check Metro Config:**
   ```javascript
   // metro.config.js
   const { getDefaultConfig } = require('expo/metro-config');

   module.exports = getDefaultConfig(__dirname);
   ```

### **Error: "Razorpay SDK not available"**

**Cause:** SDK not properly installed

**Solutions:**
1. **Reinstall SDK:**
   ```bash
   npm uninstall react-native-razorpay
   npx expo install react-native-razorpay
   ```

2. **Check Package.json:**
   ```json
   {
     "dependencies": {
       "react-native-razorpay": "^2.3.0"
     }
   }
   ```

### **Error: "SDK open method not available"**

**Cause:** SDK linked but methods not accessible

**Solutions:**
1. **Rebuild Native Dependencies:**
   ```bash
   cd android && ./gradlew clean && cd ..
   npx expo run:android
   ```

2. **Check SDK Import:**
   ```javascript
   // Correct import
   import RazorpayCheckout from 'react-native-razorpay';

   // Check if available
   console.log('RazorpayCheckout:', RazorpayCheckout);
   console.log('Methods:', Object.keys(RazorpayCheckout || {}));
   ```

## 📱 **PLATFORM SPECIFIC FIXES**

### **Android Fixes:**
```bash
# Clean Android build
cd android
./gradlew clean
./gradlew cleanBuildCache
cd ..

# Rebuild
npx expo run:android --no-build-cache
```

### **iOS Fixes:**
```bash
# Clean iOS build
cd ios
rm -rf build
cd ..

# Rebuild
npx expo run:ios --no-build-cache
```

## 🔧 **ADVANCED DEBUGGING**

### **1. Check Native Linking:**
```javascript
// In your app, add this debug code
import { NativeModules } from 'react-native';

console.log('Available native modules:');
console.log(Object.keys(NativeModules));

// Look for Razorpay-related modules
const razorpayModules = Object.keys(NativeModules).filter(key =>
  key.toLowerCase().includes('razorpay')
);
console.log('Razorpay modules:', razorpayModules);
```

### **2. Manual SDK Test:**
```javascript
// Test SDK directly
try {
  const RazorpayCheckout = require('react-native-razorpay').default;
  console.log('SDK loaded:', !!RazorpayCheckout);
  console.log('Open method:', typeof RazorpayCheckout?.open);
} catch (error) {
  console.error('SDK load error:', error);
}
```

### **3. Environment Check:**
```javascript
// Check all environment variables
console.log('Environment check:');
console.log('Platform:', Platform.OS);
console.log('Version:', Platform.Version);
console.log('Constants:', Platform.constants);
console.log('API Key exists:', !!process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID);
```

## 🚀 **QUICK START COMMANDS**

```bash
# 1. Clear everything
npx expo start --clear
rm -rf node_modules/.cache .expo

# 2. Reinstall SDK
npm uninstall react-native-razorpay
npx expo install react-native-razorpay

# 3. Rebuild for your platform
npx expo run:android  # or ios

# 4. Test in app
# Use PaymentSDKTest component to verify
```

## ✅ **VERIFICATION STEPS**

After applying fixes, verify with:

1. **Check Console:** Look for "SDK integration test passed"
2. **Test Payment:** Try a small payment (₹1)
3. **Check Logs:** Ensure no null reference errors
4. **Verify UI:** Razorpay checkout should open properly

## 📞 **STILL HAVING ISSUES?**

If the problem persists:

1. **Check Expo SDK Version:**
   ```bash
   npx expo --version
   # Should be compatible with react-native-razorpay
   ```

2. **Update Expo CLI:**
   ```bash
   npm install -g @expo/cli@latest
   ```

3. **Try Different Approach:**
   - Consider using WebView integration as fallback
   - Check Razorpay's Expo-specific documentation
   - Contact Expo support for native module issues

## 🎯 **SUCCESS INDICATORS**

✅ **SDK Test Passes:** `"Razorpay SDK integration test passed"`
✅ **No Null Errors:** No "Cannot read property 'open' of null"
✅ **Payment Opens:** Razorpay checkout UI appears
✅ **Payment Completes:** Success/failure callbacks work

**Remember: Always use development builds, never Expo Go for native modules!** 🚀