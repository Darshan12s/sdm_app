@echo off
echo ===========================================
echo 🚀 JAVA 17 INSTALLATION GUIDE FOR WINDOWS
echo ===========================================
echo.
echo This script will guide you through installing Java 17
echo to fix the Expo Android build error.
echo.
echo Current Error: "Android Gradle plugin requires Java 17 to run"
echo Current Java: Java 11
echo Required Java: Java 17 or higher
echo.

echo 📋 STEP-BY-STEP INSTALLATION:
echo =============================
echo.
echo 1. 📥 DOWNLOAD JAVA 17:
echo    • Go to: https://adoptium.net/temurin/releases/
echo    • Download: "Windows x64 JDK" (Latest 17.x.x version)
echo    • File: OpenJDK17U-jdk_x64_windows_hotspot_17.x.x_xx.msi
echo.
echo 2. 🛠️  INSTALL JAVA 17:
echo    • Run the downloaded .msi installer
echo    • Choose default installation path
echo    • Complete installation
echo.
echo 3. ✅ VERIFY INSTALLATION:
echo    • Open new Command Prompt
echo    • Run: java -version
echo    • Should show: "openjdk version 17.x.x"
echo.
echo 4. 🔧 RUN FIX SCRIPT:
echo    • Run: fix-java-version.bat
echo    • This sets JAVA_HOME and PATH automatically
echo.
echo 5. 🧪 TEST EXPO BUILD:
echo    • Run: npx expo run:android
echo    • Should build successfully now!
echo.

echo 🔗 DIRECT DOWNLOAD LINKS:
echo ========================
echo.
echo 🌟 RECOMMENDED (Eclipse Temurin):
echo https://adoptium.net/temurin/releases/
echo.
echo 💼 ALTERNATIVE (Microsoft OpenJDK):
echo https://learn.microsoft.com/en-us/java/openjdk/download
echo.
echo 📦 ORACLE JDK 17 (Requires account):
echo https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html
echo.

echo ⚠️  IMPORTANT NOTES:
echo ===================
echo.
echo • Close all Command Prompt/PowerShell windows before installation
echo • Use default installation paths
echo • Restart VS Code after installation
echo • Run fix-java-version.bat after installation
echo • Test with: npx expo run:android
echo.

echo 🎯 WHAT TO EXPECT AFTER INSTALLATION:
echo =====================================
echo.
echo ✅ java -version shows Java 17.x.x
echo ✅ npx expo run:android builds successfully
echo ✅ Razorpay SDK loads without null errors
echo ✅ Payment testing works perfectly
echo.

echo 📞 SUPPORT:
echo ===========
echo.
echo If you encounter issues:
echo 1. Check JAVA_FIX_README.md for detailed troubleshooting
echo 2. Verify installation path in fix-java-version.bat
echo 3. Ensure no other Java versions are interfering
echo.

echo 🚀 READY TO START?
echo ==================
echo.
echo 1. Download Java 17 from the links above
echo 2. Install it with default settings
echo 3. Run: fix-java-version.bat
echo 4. Test: npx expo run:android
echo.
echo Your Expo Android builds will work perfectly! 🎉
echo.

pause