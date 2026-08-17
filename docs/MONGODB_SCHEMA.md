# MongoDB Schema

Database: `ai_research_team`

---

## users
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "password_hash": "string",
  "created_at": "datetime",
  "projects_count": "int"
}
```
Indexes: `email` (unique)

---

## research_projects
```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "topic": "string",
  "description": "string | null",
  "url": "string | null",
  "file_path": "string | null",
  "status": "pending | processing | completed | failed",
  "agents_status": {
    "coordinator": "idle | running | completed | failed",
    "research": "idle | running | completed | failed",
    "summarizer": "idle | running | completed | failed",
    "diagram": "idle | running | completed | failed",
    "presentation": "idle | running | completed | failed",
    "report": "idle | running | completed | failed"
  },
  "has_report": "bool",
  "has_slides": "bool",
  "has_diagram": "bool",
  "documents": ["string"],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```
Indexes: `user_id`, `created_at`

---

## agent_logs
```json
{
  "_id": "ObjectId",
  "project_id": "string",
  "agent_name": "coordinator | research | summarizer | diagram | presentation | report",
  "status": "running | completed | failed",
  "message": "string",
  "data": "object | null",
  "timestamp": "datetime"
}
```
Indexes: `project_id`

---

## reports
```json
{
  "_id": "ObjectId",
  "project_id": "string",
  "title": "string",
  "executive_summary": "string",
  "findings": [{ "section": "string", "content": "string" }],
  "key_insights": ["string"],
  "recommendations": ["string"],
  "references": ["string"],
  "created_at": "datetime"
}
```
Indexes: `project_id`

---

## slides
```json
{
  "_id": "ObjectId",
  "project_id": "string",
  "title": "string",
  "slides": [{
    "slide_number": "int",
    "slide_type": "title | content | summary",
    "title": "string",
    "bullet_points": ["string"],
    "notes": "string"
  }],
  "created_at": "datetime"
}
```
Indexes: `project_id`

---

## diagrams
```json
{
  "_id": "ObjectId",
  "project_id": "string",
  "diagram_type": "mindmap",
  "title": "string",
  "mermaid_code": "string",
  "flowchart_code": "string",
  "created_at": "datetime"
}
```
Indexes: `project_id`
