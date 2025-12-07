@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   LabMate Pro - 本地启动脚本
echo ========================================
echo.
echo 正在启动本地服务器...
echo.
echo 项目地址: http://localhost:8000
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

REM 尝试使用 Python 启动服务器
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo 使用 Python 启动服务器...
    python -m http.server 8000
) else (
    echo Python 未安装,尝试使用 Node.js...
    npx --version >nul 2>&1
    if %errorlevel% == 0 (
        npx http-server -p 8000
    ) else (
        echo.
        echo [错误] 未找到 Python 或 Node.js
        echo.
        echo 请安装以下任一工具:
        echo - Python 3.x: https://www.python.org/downloads/
        echo - Node.js: https://nodejs.org/
        echo.
        pause
    )
)
