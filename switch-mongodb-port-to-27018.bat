@echo off
echo Updating MongoDB configuration to port 27018...
powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-Command', '(Get-Content ''C:\Program Files\MongoDB\Server\9.0\bin\mongod.cfg'') -replace ''port:\s*27017'', ''port: 27018'' | Set-Content ''C:\Program Files\MongoDB\Server\9.0\bin\mongod.cfg''; Restart-Service MongoDB; Write-Host ''MongoDB service is now running on port 27018!'' -ForegroundColor Green'"
echo Done! Please click 'Yes' on the administrator prompt if prompted.
