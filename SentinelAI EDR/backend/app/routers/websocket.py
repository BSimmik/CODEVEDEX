from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
import logging

logger = logging.getLogger("websocket")

class ConnectionManager:
    def __init__(self):
        # We store connections mapping to specific sub-channels or simple list for global updates
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New SOC console connected via WebSocket. Active sessions: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"SOC console disconnected. Active sessions: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast(self, message: dict):
        logger.info(f"Broadcasting SOC event: {message.get('type')}")
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        # Cleanup dead sockets
        for conn in disconnected:
            self.disconnect(conn)

# Singleton manager
ws_manager = ConnectionManager()

router = APIRouter(prefix="/ws", tags=["WebSockets"])

@router.websocket("/soc")
async def soc_websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Keep connection alive, listen for client messages if any
        while True:
            data = await websocket.receive_text()
            # Echo or process commands
            try:
                parsed = json.loads(data)
                # Handle client-to-server commands (e.g. request ping)
                if parsed.get("cmd") == "ping":
                    await websocket.send_json({"type": "pong"})
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"Error in websocket loop: {e}")
        ws_manager.disconnect(websocket)
