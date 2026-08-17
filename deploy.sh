#!/bin/bash

# Luminar AI - AWS VPS Deployment Script
# Run this script on your AWS EC2 instance (Ubuntu/Debian) to deploy the project.

set -e

echo "🚀 Starting Luminar AI deployment..."

# 1. Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed. (You may need to log out and back in for group changes to take effect)"
fi

# 2. Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed."
fi

# 3. Ensure environment variables exist
echo "🔧 Checking environment files..."
if [ ! -f "backend/.env" ]; then
    echo "⚠️ backend/.env not found! Creating a placeholder. Please edit it and add your GEMINI_API_KEY."
    cat <<EOF > backend/.env
APP_NAME="Luminar AI"
DEBUG=False
MONGODB_URL="mongodb://mongo:27017"
MONGODB_DB_NAME="ai_research_team"
GEMINI_API_KEY="your_api_key_here"
SEARCHAPI_KEY="fM9kJgnpgckmBrib8MGupbyY"
REDIS_URL="redis://redis:6379"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost"
EOF
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️ frontend/.env.local not found! Creating default."
    cat <<EOF > frontend/.env.local
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_WS_URL=/ws
EOF
fi

# 4. Build and start containers
echo "🐳 Building and starting Docker containers..."
sudo docker-compose down
sudo docker-compose build
sudo docker-compose up -d

echo "🎉 Deployment successful!"
echo "🌐 Your application should now be accessible at your server's Public IP address (Port 80)."
echo "   (Make sure port 80 is open in your AWS Security Group)"
