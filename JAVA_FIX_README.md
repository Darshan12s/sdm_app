# 🔧 Java Version Fix for Expo Android Build

## 🚨 **ERROR: "Android Gradle plugin requires Java 17 to run. You are currently using Java 11."**

This error occurs because newer versions of Expo and Android require Java 17 or higher, but your system is using Java 11.

## 🛠️ **QUICK FIX OPTIONS**

### **Option 1: Automated Fix (Recommended)**
```bash
# Run the automated fix script
fix-java-version.bat
```

### **Option 2: Manual Fix**
```bash
# 1. Download Java 17 from Microsoft:
# https://learn.microsoft.com/en-us/java/openjdk/download

# 2. Install Java 17

# 3. Set environment variables:
setx JAVA_HOME "C:\Program Files\Microsoft\jdk-17.0.x" /M
setx PATH "%JAVA_HOME%\bin;%PATH%" /M

# 4. Restart terminal and verify:
java -version
# Should show: Java 17.x.x
```

### **Option 3: Use Expo Application Services (EAS)**
```bash
# Build without local Java setup
npx eas build --platform android --profile development
```

## 📋 **DETAILED FIX STEPS**

### **Step 1: Check Current Java Version**
```bash
java -version
# Current: Java 11.x.x (PROBLEM)
# Needed: Java 17.x.x or 21.x.x (SOLUTION)
```

### **Step 2: Download Java 17**
Choose one of these options:

#### **Option A: Microsoft OpenJDK 17 (Recommended)**
1. Go to: https://learn.microsoft.com/en-us/java/openjdk/download
2. Download Windows x64 MSI installer
3. Install with default settings

#### **Option B: Eclipse Temurin (Alternative)**
1. Go to: https://adoptium.net/temurin/releases/
2. Download Windows x64 JDK 17
3. Install with default settings

#### **Option C: Oracle JDK 17**
1. Go to: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html
2. Accept license agreement
3. Download Windows x64 installer
4. Install with default settings

### **Step 3: Set Environment Variables**
```bash
# Replace X.X.X with your actual version number
setx JAVA_HOME "C:\Program Files\Microsoft\jdk-17.X.X.X" /M
setx PATH "%JAVA_HOME%\bin;%PATH%" /M
```

### **Step 4: Restart Terminal**
```bash
# Close and reopen Command Prompt/PowerShell
# Or restart VS Code terminal
```

### **Step 5: Verify Installation**
```bash
java -version
# Should show: openjdk version "17.X.X"

echo %JAVA_HOME%
# Should show: C:\Program Files\Microsoft\jdk-17.X.X.X
```

### **Step 6: Clear Expo Cache**
```bash
npx expo start --clear
```

### **Step 7: Build Android App**
```bash
npx expo run:android
```

## 🔍 **TROUBLESHOOTING**

### **Still Getting Java 11 Error?**
```bash
# Check if multiple Java versions exist
where java

# Check JAVA_HOME
echo %JAVA_HOME%

# Check PATH
echo %PATH%
```

### **Multiple Java Versions?**
If you have multiple Java versions:
```bash
# Remove old Java from PATH
# Edit environment variables and remove old Java paths
# Keep only Java 17+ in PATH
```

### **Gradle Issues?**
```bash
# Clear Gradle cache
cd android
./gradlew clean
./gradlew cleanBuildCache
cd ..
```

## 🚀 **ALTERNATIVE: Use EAS Build**

If local Java setup is problematic, use Expo Application Services:

### **Step 1: Install EAS CLI**
```bash
npm install -g @expo/eas-cli
```

### **Step 2: Login to EAS**
```bash
eas login
```

### **Step 3: Configure EAS Build**
```javascript
// eas.json
{
  "build": {
    "development": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### **Step 4: Build with EAS**
```bash
npx eas build --platform android --profile development
```

### **Step 5: Install on Device**
```bash
# Download APK from EAS dashboard
# Install on Android device/emulator
```

## 📱 **TESTING YOUR FIX**

### **Step 1: Verify Java Version**
```bash
java -version
# ✅ Should show Java 17.x.x or 21.x.x
```

### **Step 2: Build Expo App**
```bash
npx expo run:android
# ✅ Should build successfully without Java errors
```

### **Step 3: Test Razorpay SDK**
```javascript
// In your app, test the SDK
import { PaymentSDKTest } from './src/components/PaymentSDKTest';
<PaymentSDKTest />
```

## ✅ **SUCCESS INDICATORS**

- ✅ `java -version` shows Java 17+
- ✅ `npx expo run:android` builds successfully
- ✅ No more "Java 11" errors
- ✅ Razorpay SDK loads properly
- ✅ Payment modal opens without null errors

## 📞 **STILL HAVING ISSUES?**

### **Check System Requirements:**
- ✅ Windows 10/11
- ✅ At least 8GB RAM
- ✅ Android Studio installed
- ✅ Android SDK configured

### **Common Issues:**
1. **PATH not updated** → Restart terminal
2. **Multiple Java versions** → Remove old versions from PATH
3. **Android Studio using wrong Java** → Configure in Android Studio settings
4. **Gradle cache corrupted** → Clear cache and rebuild

### **Get Help:**
- Check Expo documentation: https://docs.expo.dev/
- Android Studio setup: https://developer.android.com/studio
- Java downloads: https://adoptium.net/

## 🎉 **SUCCESS!**

**Once Java 17+ is installed and configured, your Expo Android build will work perfectly with Razorpay SDK!** 🚀📱

**You can then test payments without any null reference errors!** 💳✨