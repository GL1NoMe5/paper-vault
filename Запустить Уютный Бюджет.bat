@echo off
chcp 65001 >nul
cd /d "%~dp0"

if exist "dist-electron\Уютный Бюджет 1.0.0.exe" (
    start "" "dist-electron\Уютный Бюджет 1.0.0.exe"
    exit /b 0
)

if exist "dist-electron\win-unpacked\Уютный Бюджет.exe" (
    start "" "dist-electron\win-unpacked\Уютный Бюджет.exe"
    exit /b 0
)

if exist "dist\index.html" (
    start "" cmd /c "npx.cmd electron ."
    exit /b 0
)

call npm.cmd run build
start "" cmd /c "npx.cmd electron ."
exit /b 0
