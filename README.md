# AI Research Team Agents 🧠

A production-ready multi-agent AI research platform where autonomous AI agents collaborate to research, analyze, and present information.

## Architecture

```
ai-research-team/
├── frontend/          # Next.js 15 + TypeScript + TailwindCSS
├── backend/           # FastAPI + Python + WebSockets
├── docker/            # Docker configurations
├── nginx/             # Nginx reverse proxy config
└── docs/              # Documentation
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB Atlas account
- Gemini API key

### 1. Clone and Setup

```bash
git clone <repo>
cd ai-research-team
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Fill in your .env values
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in your .env.local values
npm run dev
```

### 4. Docker (Full Stack)

```bash
docker-compose up --build
```

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`

## Features

- 🤖 6 Autonomous AI Agents (Research, Summarizer, Diagram, Presentation, Report, Coordinator)
- 📊 Real-time workflow visualization via WebSockets
- 📄 PDF/DOCX/URL upload support
- 🎨 Generated diagrams (Mermaid), slides, and reports
- 🔐 JWT authentication
- 📦 MongoDB Atlas database
- 🚀 AWS EC2 + Docker deployment ready
