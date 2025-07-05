@echo off
echo ============================================================
echo SQL Server Status Check - BiHortus ARCA Connection
echo ============================================================
echo Computer: %COMPUTERNAME%
echo Date: %DATE% %TIME%
echo.

echo Checking SQL Server Services...
echo ============================================================
sc query MSSQLSERVER 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] MSSQLSERVER service not found
) else (
    echo [OK] MSSQLSERVER service found
)

echo.
sc query SQLSERVERAGENT 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] SQLSERVERAGENT service not found
) else (
    echo [OK] SQLSERVERAGENT service found
)

echo.
sc query SQLBrowser 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] SQLBrowser service not found
) else (
    echo [OK] SQLBrowser service found
)

echo.
echo Checking SQL Server Installation...
echo ============================================================
if exist "C:\Program Files\Microsoft SQL Server" (
    echo [OK] SQL Server installation directory found
    dir "C:\Program Files\Microsoft SQL Server" /b
) else (
    echo [ERROR] SQL Server installation directory not found
)

echo.
echo Checking for SQL Server instances...
echo ============================================================
reg query "HKLM\SOFTWARE\Microsoft\Microsoft SQL Server\Instance Names\SQL" 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] No SQL Server instances found in registry
) else (
    echo [OK] SQL Server instances found
)

echo.
echo Checking TCP/IP port 1433...
echo ============================================================
netstat -an | findstr :1433
if %errorlevel% neq 0 (
    echo [ERROR] Port 1433 is not listening
) else (
    echo [OK] Port 1433 is listening
)

echo.
echo Checking if database files exist...
echo ============================================================
if exist "C:\GESTIONALI\SQL_DATA\MSSQL13.MSSQLSERVER\MSSQL\DATA\ADB_BOTTAMEDI.mdf" (
    echo [OK] ADB_BOTTAMEDI database file found
) else (
    echo [ERROR] ADB_BOTTAMEDI database file not found
)

echo.
echo Checking Windows Firewall...
echo ============================================================
netsh advfirewall firewall show rule name="SQL Server" 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] No specific SQL Server firewall rule found
) else (
    echo [OK] SQL Server firewall rule exists
)

echo.
echo Testing connection to localhost...
echo ============================================================
telnet localhost 1433
if %errorlevel% neq 0 (
    echo [ERROR] Cannot connect to localhost:1433
) else (
    echo [OK] Can connect to localhost:1433
)

echo.
echo ============================================================
echo Check completed. Please review the results above.
echo ============================================================
pause