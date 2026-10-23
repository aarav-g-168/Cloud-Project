#!/bin/bash
#
# Simple startup script for Cloud Busters application
# Can be used manually on EC2 or adapted for user data
#

# Navigate to application directory
cd "$(dirname "$0")" || exit 1

# Check if .env exists, if not copy from example
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Please edit .env with your actual RDS credentials before starting the app."
    echo "Edit .env and then re-run this script."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Start the application
echo "Starting Cloud Busters application..."
echo "Application will be available at http://localhost:${PORT:-3000}"
echo "Health check: http://localhost:${PORT:-3000}/api/health"
echo ""

# Start in foreground (for manual use) or background with nohup
# For manual use: npm start
# For background: nohup npm start > app.log 2>&1 &
npm start