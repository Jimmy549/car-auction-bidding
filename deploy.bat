@echo off
echo Starting Backend Deployment...
echo.

echo Installing dependencies...
call npm install

echo.
echo Building project...
call npm run build

echo.
echo Project built successfully!
echo Ready for Vercel deployment.
echo.
echo Next steps:
echo 1. Run: vercel
echo 2. Follow the prompts
echo 3. Set environment variables in Vercel dashboard
echo.
pause