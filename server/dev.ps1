# Development startup script for Disfluency Analyzer API with auto-reload
# Run this script to start the server with hot-reload on file changes

Write-Host "Starting Disfluency Analyzer API in development mode..." -ForegroundColor Green
Write-Host "The server will automatically restart when you save changes to .py files" -ForegroundColor Cyan
Write-Host ""

# Run uvicorn with --reload flag for auto-restart on file changes
uvicorn analyze_api:app --reload --host 0.0.0.0 --port 8001
