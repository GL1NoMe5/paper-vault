@echo off
chcp 65001 >nul
cd /d "%~dp0"
call "Запустить Уютный Бюджет.bat"
exit /b %errorlevel%
