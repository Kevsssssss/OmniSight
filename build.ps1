# OmniSight Build Script

Write-Host "Building OmniSight in Release mode..." -ForegroundColor Cyan

# 1. Build the Dashboard (this will trigger the UI build as well)
Write-Host "Building Dashboard..." -ForegroundColor Yellow
dotnet publish src/OmniSight.Dashboard/OmniSight.Dashboard.csproj -c Release -r win-x64 --self-contained true

# Sync UI to local wwwroot for consistency
Write-Host "Syncing UI to local wwwroot..." -ForegroundColor Yellow
Copy-Item -Path "src/omnisight-dashboard-ui/out/*" -Destination "src/OmniSight.Dashboard/wwwroot/" -Recurse -Force

# 2. Build the Client
Write-Host "Building Client..." -ForegroundColor Yellow
dotnet publish src/OmniSight.Client/OmniSight.Client.csproj -c Release -r win-x64 --self-contained true

Write-Host "Build Complete! Files are ready for Inno Setup." -ForegroundColor Green
