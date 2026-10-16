@echo off
:: HWiNFO Dashboard — Healthcheck Service Installer
:: -------------------------------------------------------
:: Registers healthcheck_server.py as a Windows service using NSSM.
:: Must be run as Administrator.
::
:: Prerequisites:
::   - Python 3 installed and python.exe on PATH
::   - nssm.exe on PATH (download from https://nssm.cc)
::
:: To uninstall:
::   nssm stop HWinfoDashboardHealth
::   nssm remove HWinfoDashboardHealth confirm

setlocal

set SERVICE_NAME=HWinfoDashboardHealth

:: %~dp0 always ends with a trailing backslash.
:: Stripping it prevents cmd.exe from treating \" as an escaped quote
:: when the path is wrapped in double quotes (e.g. "D:\path\" → "D:\path\").
set SCRIPT_DIR=%~dp0
set SCRIPT_DIR=%SCRIPT_DIR:~0,-1%

set SCRIPT=%SCRIPT_DIR%\healthcheck_server.py
set LOG=%SCRIPT_DIR%\healthcheck-service.log

:: Resolve full path to python.exe so the service works under the SYSTEM account,
:: which has a different PATH than the user account.
for /f "delims=" %%i in ('where python 2^>nul') do (
    set PYTHON_EXE=%%i
    goto :found_python
)

echo ERROR: python.exe not found on PATH.
echo Install Python 3 from https://www.python.org and ensure it is added to PATH.
pause
exit /b 1

:found_python
echo Found Python: %PYTHON_EXE%

:: Remove existing service if present (clean reinstall)
nssm status %SERVICE_NAME% >nul 2>&1
if %errorlevel% equ 0 (
    echo Removing existing service "%SERVICE_NAME%" for clean reinstall...
    nssm stop %SERVICE_NAME% >nul 2>&1
    nssm remove %SERVICE_NAME% confirm
)

echo Installing service "%SERVICE_NAME%"...
nssm install %SERVICE_NAME% "%PYTHON_EXE%"
nssm set %SERVICE_NAME% AppParameters "\"healthcheck_server.py\""
nssm set %SERVICE_NAME% AppDirectory "%SCRIPT_DIR%"
nssm set %SERVICE_NAME% AppStdout "%LOG%"
nssm set %SERVICE_NAME% AppStderr "%LOG%"
nssm set %SERVICE_NAME% AppRotateFiles 1
nssm set %SERVICE_NAME% AppRotateBytes 1048576
nssm set %SERVICE_NAME% Start SERVICE_AUTO_START
nssm start %SERVICE_NAME%

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Service failed to start. Check the log for details:
    echo   %LOG%
    echo.
    echo You can also check the Windows Event Viewer for service errors.
) else (
    echo.
    echo Done. Service "%SERVICE_NAME%" is installed and running.
)

echo.
echo Useful commands:
echo   nssm status %SERVICE_NAME%
echo   nssm stop   %SERVICE_NAME%
echo   nssm start  %SERVICE_NAME%
echo   nssm remove %SERVICE_NAME% confirm
echo.
pause
endlocal
