@echo off
echo ===========================================
echo 🚀 ANDROID SDK LOCATION FIX FOR EXPO BUILD
echo ===========================================
echo.
echo This script will help you set up the Android SDK location
echo to fix the "SDK location not found" error in Expo builds.
echo.
echo Current Error: SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable or by setting the sdk.dir path in your project's local properties file.
echo.

echo 📋 Checking current environment...
echo.
echo Current ANDROID_HOME: %ANDROID_HOME%
echo Current JAVA_HOME: %JAVA_HOME%
echo.

echo 🔍 Looking for Android SDK installations...
echo.

REM Common Android SDK locations
set SDK_LOCATIONS[0]="C:\Users\%USERNAME%\AppData\Local\Android\Sdk"
set SDK_LOCATIONS[1]="C:\Android\Sdk"
set SDK_LOCATIONS[2]="C:\Program Files\Android\Sdk"
set SDK_LOCATIONS[3]="C:\Program Files (x86)\Android\Sdk"

set FOUND_SDK=
for /L %%i in (0,1,3) do (
    if exist !SDK_LOCATIONS[%%i]! (
        echo ✅ Found Android SDK at: !SDK_LOCATIONS[%%i]!
        set FOUND_SDK=!SDK_LOCATIONS[%%i]!
        goto :found
    )
)

echo ❌ No Android SDK found in common locations.
echo.
echo 📥 Please install Android Studio or Android SDK manually.
echo    Download from: https://developer.android.com/studio
echo.
echo After installation, run this script again.
pause
exit /b 1

:found
echo.
echo 🔧 Setting up environment variables...
echo.

REM Set ANDROID_HOME
setx ANDROID_HOME "%FOUND_SDK%" /M
echo ✅ Set ANDROID_HOME to: %FOUND_SDK%

REM Add to PATH if not already there
echo %PATH% | find /i "%FOUND_SDK%\platform-tools" >nul
if errorlevel 1 (
    setx PATH "%PATH%;%FOUND_SDK%\platform-tools;%FOUND_SDK%\tools;%FOUND_SDK%\tools\bin" /M
    echo ✅ Added Android SDK tools to PATH
)

echo.
echo 📝 Updating local.properties file...
echo.

REM Check if android/local.properties exists
if exist "android\local.properties" (
    echo local.properties already exists. Updating...
) else (
    echo Creating local.properties...
)

REM Write to local.properties
echo sdk.dir=%FOUND_SDK%> android\local.properties
echo ✅ Updated android/local.properties with sdk.dir=%FOUND_SDK%

echo.
echo 🎉 Setup complete!
echo.
echo Please restart your command prompt and try running:
echo    npx expo run:android
echo.
echo If you still get errors, make sure:
echo - Android SDK is properly installed
echo - You have the required SDK components (API 34, build tools, etc.)
echo - Your project has the correct Expo configuration
echo.

pause
exit /b 0