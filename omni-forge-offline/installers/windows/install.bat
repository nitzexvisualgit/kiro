@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM   Omni Forge by Nitzex Visual - Windows Installer v1.0.1
REM ============================================================

set "EXT_NAME=com.nitzexvisual.omniforge"
set "TARGET=%APPDATA%\Adobe\CEP\extensions\%EXT_NAME%"
set "SRC=%~dp0..\..\"

echo.
echo  ============================================================
echo   Omni Forge Installer
echo  ============================================================
echo.

REM Refuse to run while AE is open. Otherwise the file replace silently
REM fails (Windows locks files in use) and the user thinks they updated
REM when they actually didn't. THIS WAS THE 'still showing me error' BUG.
tasklist /FI "IMAGENAME eq AfterFX.exe" 2>NUL | find /I "AfterFX.exe" >NUL
if %ERRORLEVEL% EQU 0 (
    echo  ERROR: After Effects is currently running.
    echo.
    echo   Please:
    echo     1. Save your AE work
    echo     2. Quit After Effects completely ^(File menu, Exit^)
    echo     3. Verify in Task Manager that no AfterFX.exe remains
    echo     4. Run this installer again
    echo.
    pause
    exit /b 1
)


echo  Source:  %SRC%
echo  Target:  %TARGET%
echo.

if not exist "%APPDATA%\Adobe\CEP\extensions" mkdir "%APPDATA%\Adobe\CEP\extensions"

if exist "%TARGET%" (
    echo Removing previous install...
    rmdir /s /q "%TARGET%"
    if exist "%TARGET%" (
        echo  ERROR: Could not remove old install.
        echo  Cause: a file may still be in use. Reboot Windows and try again.
        pause
        exit /b 1
    )
)

echo Copying files...
xcopy "%SRC%" "%TARGET%" /E /I /H /Y /Q >nul
if errorlevel 1 ( echo  ERROR: xcopy failed. & pause & exit /b 1 )

REM Verify a critical file actually copied
if not exist "%TARGET%\client\js\bridge.js" (
    echo  ERROR: bridge.js missing after copy. Install incomplete.
    pause
    exit /b 1
)

REM Strip dev-only folders
for %%D in (installers keys server scripts docs .git .github node_modules) do (
    if exist "%TARGET%\%%D" rmdir /s /q "%TARGET%\%%D"
)
del /q "%TARGET%\.debug" 2>nul

echo 1.0.1 > "%TARGET%\.installed-version"

for %%V in (9 10 11 12 13) do (
    reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
)

echo.
echo  ============================================================
echo   Installed successfully ^(v1.0.1^).
echo.
echo   1. Launch After Effects
echo   2. Window, Extensions, Omni Forge
echo   3. Activate with a key from keys\keys.txt
echo  ============================================================
echo.
pause
