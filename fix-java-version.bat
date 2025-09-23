@echo off
echo 🔧 Java Version Fix for Expo Android Build
echo ==========================================
echo.

echo 📋 Current Java Version:
java -version 2>&1
echo.

echo 🔍 Checking for Java 17/21 installations...
echo.

echo Looking for Java in common locations...

REM Check for Java 17 in common locations
if exist "C:\Program Files\Microsoft\jdk-17" (
    echo ✅ Found Microsoft JDK 17 at: C:\Program Files\Microsoft\jdk-17
    set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17"
    goto :set_java_home
)

if exist "C:\Program Files\Microsoft\jdk-21" (
    echo ✅ Found Microsoft JDK 21 at: C:\Program Files\Microsoft\jdk-21
    set "JAVA_HOME=C:\Program Files\Microsoft\jdk-21"
    goto :set_java_home
)

if exist "C:\Program Files\Java\jdk-17" (
    echo ✅ Found Oracle JDK 17 at: C:\Program Files\Java\jdk-17
    set "JAVA_HOME=C:\Program Files\Java\jdk-17"
    goto :set_java_home
)

if exist "C:\Program Files\Java\jdk-21" (
    echo ✅ Found Oracle JDK 21 at: C:\Program Files\Java\jdk-21
    set "JAVA_HOME=C:\Program Files\Java\jdk-21"
    goto :set_java_home
)

if exist "C:\Program Files\Eclipse Adoptium\jdk-17" (
    echo ✅ Found Eclipse Temurin JDK 17 at: C:\Program Files\Eclipse Adoptium\jdk-17
    set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17"
    goto :set_java_home
)

if exist "C:\Program Files\Eclipse Adoptium\jdk-21" (
    echo ✅ Found Eclipse Temurin JDK 21 at: C:\Program Files\Eclipse Adoptium\jdk-21
    set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21"
    goto :set_java_home
)

REM Check if JAVA_HOME is already set to a valid Java 17+
if defined JAVA_HOME (
    echo Current JAVA_HOME: %JAVA_HOME%
    if exist "%JAVA_HOME%\bin\java.exe" (
        "%JAVA_HOME%\bin\java.exe" -version 2>&1 | findstr /C:"17." >nul
        if %errorlevel% equ 0 (
            echo ✅ JAVA_HOME is already set to Java 17+
            goto :verify_setup
        )
        "%JAVA_HOME%\bin\java.exe" -version 2>&1 | findstr /C:"21." >nul
        if %errorlevel% equ 0 (
            echo ✅ JAVA_HOME is already set to Java 21+
            goto :verify_setup
        )
    )
)

echo ❌ No Java 17+ installation found automatically.
echo.
echo 📥 Please download and install Java 17 or 21:
echo.
echo Option 1 - Microsoft OpenJDK 17:
echo https://learn.microsoft.com/en-us/java/openjdk/download
echo.
echo Option 2 - Eclipse Temurin (Recommended):
echo https://adoptium.net/temurin/releases/
echo.
echo Option 3 - Oracle JDK 17:
echo https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html
echo.
echo After installation, run this script again.
echo.
pause
exit /b 1

:set_java_home
echo.
echo 🔧 Setting JAVA_HOME to: %JAVA_HOME%
setx JAVA_HOME "%JAVA_HOME%" /M
echo ✅ JAVA_HOME set permanently
echo.

echo 🔧 Adding Java to PATH...
set "PATH=%JAVA_HOME%\bin;%PATH%"
setx PATH "%JAVA_HOME%\bin;%PATH%" /M
echo ✅ Java added to PATH permanently
echo.

:verify_setup
echo 🔍 Verifying Java setup...
echo.

echo Current JAVA_HOME: %JAVA_HOME%
echo.

java -version
echo.

echo ✅ Java setup complete!
echo.
echo 🚀 Now try building your Expo app:
echo npx expo run:android
echo.

pause