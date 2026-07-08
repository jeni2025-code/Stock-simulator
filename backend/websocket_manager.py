"""
WebSocket Connection Manager.
Manages multiple WS clients and supports topic-based broadcasting.
"""

from fastapi import WebSocket
from typing import Dict, List, Set
import json
import asyncio


class ConnectionManager:
    def __init__(self):
        # Map topic -> set of WebSocket connections
        self.connections: Dict[str, Set[WebSocket]] = {
            "market": set(),
            "orderbook": set(),
            "trades": set(),
            "portfolio": set(),
        }
        # Map ws -> subscribed topics
        self.ws_topics: Dict[WebSocket, Set[str]] = {}

    async def connect(self, websocket: WebSocket, topic: str = "market"):
        await websocket.accept()
        if topic not in self.connections:
            self.connections[topic] = set()
        self.connections[topic].add(websocket)
        if websocket not in self.ws_topics:
            self.ws_topics[websocket] = set()
        self.ws_topics[websocket].add(topic)

    def disconnect(self, websocket: WebSocket):
        topics = self.ws_topics.pop(websocket, set())
        for topic in topics:
            self.connections.get(topic, set()).discard(websocket)

    async def broadcast(self, topic: str, data: dict):
        """Broadcast JSON message to all subscribers of a topic."""
        message = json.dumps(data)
        dead = set()
        for ws in list(self.connections.get(topic, set())):
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.disconnect(ws)

    async def send_personal(self, websocket: WebSocket, data: dict):
        try:
            await websocket.send_text(json.dumps(data))
        except Exception:
            self.disconnect(websocket)


manager = ConnectionManager()
