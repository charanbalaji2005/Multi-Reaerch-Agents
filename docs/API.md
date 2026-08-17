# API Documentation

Base URL: `http://localhost:8000`

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

---

## Authentication

### POST /auth/register
Create a new user account.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com", ... }
}
```

---

### POST /auth/login
Authenticate an existing user.

**Body:**
```json
{ "email": "john@example.com", "password": "securepassword" }
```

---

### GET /auth/me
Get current user profile.

---

## Research

### POST /research/create
Start a new research project. Accepts `multipart/form-data`.

**Fields:**
- `topic` (required): Research topic string
- `description` (optional): Additional context
- `url` (optional): URL to analyze
- `file` (optional): PDF/DOCX/TXT file upload

**Response:**
```json
{ "id": "project_id", "status": "pending", "message": "Research started" }
```

---

### GET /research/list
List all projects for the current user.

---

### GET /research/{id}
Get a single project with agent statuses.

---

### GET /research/{id}/report
Get the generated research report (available after completion).

---

### GET /research/{id}/slides
Get generated presentation slides.

---

### GET /research/{id}/diagram
Get generated Mermaid diagrams.

---

### GET /research/{id}/logs
Get agent activity logs for a project.

---

### DELETE /research/{id}
Delete a project and all associated data.

---

## Agents

### GET /agents/
List all available agents with descriptions.

### GET /agents/status/{project_id}
Get real-time agent status for a project.

---

## WebSocket

### WS /ws/{project_id}
Connect for real-time updates on a research project.

**Messages received:**
```json
// Agent update
{ "type": "agent_update", "agent": "research", "status": "running", "message": "...", "timestamp": "..." }

// Progress update
{ "type": "progress", "progress": 65, "message": "Generating outputs...", "timestamp": "..." }

// Completion
{ "type": "complete", "message": "Research complete!", "timestamp": "..." }
```

**Send ping:**
```
ping  →  pong
```
