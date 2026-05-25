@echo off
set "EXT_NAME=com.nitzexvisual.omniforge"
set "TARGET=%APPDATA%\Adobe\CEP\extensions\%EXT_NAME%"

if exist "%TARGET%" (
    rmdir /s /q "%TARGET%"
    echo Omni Forge uninstalled.
) else (
    echo Omni Forge is not installed.
)
pause
