@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM   Omni Forge by Nitzex Visual - Windows Installer
REM   Copies the CEP extension into the AE shared extensions folder
REM   and enables PlayerDebugMode so the unsigned panel will load.
REM ============================================================

set "EXT_NAME=com.nitzexvisual.omniforge"
set "TARGET=%APPDATA%\Adobe\CEP\extensions\%EXT_NAME%"
set "SRC=%~dp0..\..\"

echo.
echo  Omni Forge Installer
echo  --------------------
echo  Source:  %SRC%
echo  Target:  %TARGET%
echo.

REM Ensure CEP extensions folder exists
if not exist "%APPDATA%\Adobe\CEP\extensions" mkdir "%APPDATA%\Adobe\CEP\extensions"

REM Remove old install
if exist "%TARGET%" (
    echo Removing previous install...
    rmdir /s /q "%TARGET%"
)

REM Copy fresh
echo Copying files...
xcopy "%SRC%" "%TARGET%" /E /I /H /Y /Q >nul
if errorlevel 1 (
    echo [ERROR] Copy failed.
    pause
    exit /b 1
)

REM Strip installer/keys/server/scripts from the deployed copy (not needed at runtime)
for %%D in (installers keys server scripts docs .git .github node_modules) do (
    if exist "%TARGET%\%%D" rmdir /s /q "%TARGET%\%%D"
)
del /q "%TARGET%\.debug" 2>nul

REM Enable CEP debug mode for all CEP versions (allows unsigned extensions)
for %%V in (9 10 11 12 13) do (
    reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
)

echo.
echo  ============================================================
echo   Installed successfully.
echo   Launch After Effects, then go to:
echo     Window  >  Extensions  >  Omni Forge
echo  ============================================================
echo.
pause
