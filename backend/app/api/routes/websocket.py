from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import asyncio

router = APIRouter()

# Connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, project_id: str):
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(websocket)

    def disconnect(self, websocket: WebSocket, project_id: str):
        if project_id in self.active_connections:
            self.active_connections[project_id].remove(websocket)
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]

    async def broadcast(self, message: dict, project_id: str):
        if project_id in self.active_connections:
            dead = []
            for ws in self.active_connections[project_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.active_connections[project_id].remove(ws)


manager = ConnectionManager()


@router.websocket("/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: str):
    await manager.connect(websocket, project_id)
    try:
        # Send initial connection message
        await websocket.send_json({
            "type": "connected",
            "message": f"Connected to research project {project_id}",
        })

        # Keep connection alive with ping/pong
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                if data == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                await websocket.send_text("ping")

    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)


async def send_agent_update(project_id: str, agent: str, status: str, message: str, data=None):
    """Send agent update to all connected clients"""
    from datetime import datetime
    msg = {
        "type": "agent_update",
        "agent": agent,
        "status": status,
        "message": message,
        "data": data,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast(msg, project_id)


async def send_progress(project_id: str, progress: int, message: str):
    from datetime import datetime
    msg = {
        "type": "progress",
        "progress": progress,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast(msg, project_id)


async def send_complete(project_id: str):
    from datetime import datetime
    msg = {
        "type": "complete",
        "message": "Research complete! All agents have finished.",
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast(msg, project_id)
