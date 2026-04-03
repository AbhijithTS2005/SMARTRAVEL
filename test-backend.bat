@echo off
REM Backend Testing Script for Smart Travel Platform
REM Run this to test all critical endpoints

echo ============================================
echo Smart Travel Backend Testing
echo ============================================
echo.

REM Set base URL
set BASE_URL=http://localhost:8000/api

echo [TEST 1] Checking server status...
curl -s "%BASE_URL%/destinations-stats" -H "Accept: application/json"
echo.
echo.

echo [TEST 2] Registering test user...
curl -s -X POST "%BASE_URL%/register" ^
  -H "Content-Type: application/json" ^
  -H "Accept: application/json" ^
  -d "{\"name\":\"Test User\",\"email\":\"test%RANDOM%@smarttravel.com\",\"password\":\"password123\",\"password_confirmation\":\"password123\"}" > test_register.json
type test_register.json
echo.
echo.

echo ============================================
echo Tests Complete!
echo Check test_register.json for auth token
echo ============================================
pause
