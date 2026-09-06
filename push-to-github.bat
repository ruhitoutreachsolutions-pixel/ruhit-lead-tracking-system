@echo off
title Push Ruhit Lead Tracking System to GitHub
echo ================================================================
echo   Pushing Ruhit Lead Tracking System to GitHub...
echo ================================================================
echo.

git remote set-url origin https://github.com/ruhitoutreachsolutions-pixel/ruhit-lead-tracking-system.git
git branch -M main
git push -u origin main --force

echo.
echo ================================================================
echo  Done! Refresh your GitHub repository page to see all files.
echo ================================================================
pause
