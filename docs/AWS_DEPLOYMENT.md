# AWS EC2 Deployment Guide

## Prerequisites
- AWS account
- EC2 instance: Ubuntu 22.04 LTS, t3.medium or larger
- Security groups: allow ports 22, 80, 443
- MongoDB Atlas cluster (free tier works)
- Gemini API key

---

## Step 1 — Launch EC2 Instance

```bash
# In AWS Console:
# AMI: Ubuntu Server 22.04 LTS
# Instance type: t3.medium (2 vCPU, 4 GB RAM)
# Storage: 20 GB gp3
# Security group: allow SSH (22), HTTP (80), HTTPS (443)
```

---

## Step 2 — Connect and Setup Server

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install -y git

# Verify
docker --version
docker-compose --version
```

---

## Step 3 — Clone and Configure

```bash
# Clone repo
git clone https://github.com/youruser/ai-research-team.git
cd ai-research-team

# Configure backend
cp backend/.env.example backend/.env
nano backend/.env
# Fill in:
#   MONGODB_URL=mongodb+srv://...
#   GEMINI_API_KEY=AIzaSy...
#   SECRET_KEY=<generate with: openssl rand -hex 32>
#   ALLOWED_ORIGINS=http://YOUR_EC2_IP,https://yourdomain.com

# Configure frontend
cp frontend/.env.example frontend/.env.local
nano frontend/.env.local
# Fill in:
#   NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP
#   NEXT_PUBLIC_WS_URL=ws://YOUR_EC2_IP
```

---

## Step 4 — Build and Run

```bash
# Build and start all services
docker-compose up --build -d

# Check status
docker-compose ps
docker-compose logs -f

# Check specific service
docker-compose logs backend -f
```

---

## Step 5 — Setup HTTPS with Let's Encrypt (optional)

```bash
# Install certbot
sudo apt install -y certbot

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com

# Copy certs to nginx/ssl/
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Update nginx.conf to enable HTTPS server block
# Then restart nginx:
docker-compose restart nginx

# Auto-renew
echo "0 12 * * * certbot renew --quiet && docker-compose restart nginx" | sudo crontab -
```

---

## Step 6 — MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com
2. Create free cluster (M0)
3. Create database user
4. Whitelist EC2 IP (or 0.0.0.0/0 for dev)
5. Get connection string → paste in backend/.env

Collections created automatically on first run:
- users
- research_projects
- reports
- slides
- diagrams
- agent_logs

---

## Useful Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart backend
docker-compose restart

# Stop all
docker-compose down

# Update (after git pull)
git pull
docker-compose up --build -d

# Check disk usage
df -h
docker system prune -f  # clean unused images
```

---

## Environment Variables Reference

### Backend (.env)
| Variable | Description |
|---|---|
| SECRET_KEY | JWT signing key (32+ chars) |
| MONGODB_URL | MongoDB Atlas connection string |
| GEMINI_API_KEY | Your Gemini API key |
| ALLOWED_ORIGINS | Comma-separated allowed CORS origins |
| MAX_FILE_SIZE_MB | Max upload file size (default 50) |

### Frontend (.env.local)
| Variable | Description |
|---|---|
| NEXT_PUBLIC_API_URL | Backend HTTP URL |
| NEXT_PUBLIC_WS_URL | Backend WebSocket URL |
