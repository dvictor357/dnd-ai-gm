from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import Dict, List
import json
import os
import aiohttp
import asyncio
import logging
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime

# Load environment variables
load_dotenv()

# Get the current directory
BASE_DIR = Path(__file__).resolve().parent

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories if they don't exist
os.makedirs(BASE_DIR / "static", exist_ok=True)
os.makedirs(BASE_DIR / "templates", exist_ok=True)

# Mount static files and templates
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.game_state = {
            "players": {},  # Store player info
            "encounters": 0,
            "rolls": 0
        }

    async def connect(self, websocket: WebSocket, player_id: str):
        await websocket.accept()
        self.active_connections[player_id] = websocket
        self.game_state["players"][player_id] = {
            "joined_at": datetime.now().isoformat()
        }

    def disconnect(self, player_id: str):
        if player_id in self.active_connections:
            del self.active_connections[player_id]
        if player_id in self.game_state["players"]:
            del self.game_state["players"][player_id]

    async def broadcast(self, message: dict):
        disconnected_players = []
        for player_id, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except Exception as e:
                logging.error(f"Error broadcasting to {player_id}: {str(e)}")
                disconnected_players.append(player_id)
        
        # Clean up disconnected players
        for player_id in disconnected_players:
            self.disconnect(player_id)

    def get_player_count(self):
        return len(self.active_connections)

    def increment_encounters(self):
        self.game_state["encounters"] += 1
        return self.game_state["encounters"]

    def increment_rolls(self):
        self.game_state["rolls"] += 1
        return self.game_state["rolls"]

manager = ConnectionManager()

async def get_ai_response(message: str) -> str:
    api_key = os.getenv('DEEPSEEK_API_KEY')
    if not api_key:
        raise ValueError("DEEPSEEK_API_KEY not found in environment variables")

    system_prompt = """You are an experienced and creative Dungeon Master for a D&D 5e campaign. Your responses should:

1. **Narrative Style**:
   - Use rich, vivid descriptions
   - Create an immersive atmosphere
   - Maintain a consistent tone
   - Use markdown formatting for emphasis

2. **Game Mechanics**:
   - Incorporate D&D 5e rules naturally
   - Suggest appropriate skill checks when relevant
   - Format dice rolls as `[d20+5]` or `[2d6]`
   - Highlight important game terms in **bold**

3. **Character Interaction**:
   - Respond to player actions dynamically
   - Create memorable NPCs with distinct personalities
   - Use *italics* for character thoughts or emphasis
   - Include character emotions and reactions

4. **World Building**:
   - Create rich, detailed environments
   - Include sensory details (sights, sounds, smells)
   - Reference established D&D lore appropriately
   - Create interesting plot hooks

5. **Response Format**:
   - Use clear paragraph breaks for readability
   - Highlight key information in **bold**
   - Use *italics* for atmospheric details
   - Include `code blocks` for game mechanics

Always maintain the fantasy atmosphere while being helpful and encouraging to players. End your responses with a clear hook or prompt for player action."""

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://api.deepseek.com/v1/chat/completions",
            json={
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                "temperature": 0.7,
                "max_tokens": 800,
                "stop": None
            },
            headers=headers
        ) as response:
            if response.status != 200:
                error_text = await response.text()
                raise Exception(f"API request failed with status {response.status}: {error_text}")
            
            response_json = await response.json()
            return response_json['choices'][0]['message']['content']

@app.get("/")
async def get():
    return FileResponse("app/templates/index.html")

@app.get("/home")
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "character_created":
                char_data = data["data"]
                player_id = f"{char_data['name']}_{datetime.now().timestamp()}"
                manager.game_state["players"][player_id] = char_data
                
                # Send confirmation back to client
                await websocket.send_json({
                    "type": "system",
                    "content": f"Welcome, {char_data['name']} the {char_data['race']} {char_data['class']}! Your adventure begins..."
                })
                
                # Update all clients with new player count
                await websocket.send_json({
                    "type": "state_update",
                    "players": len(manager.game_state["players"]),
                    "encounters": manager.game_state["encounters"],
                    "rolls": manager.game_state["rolls"]
                })
            
            elif data["type"] == "action":
                # Get AI response
                response = await get_ai_response(data["content"])
                
                # Send response back to client
                await websocket.send_json({
                    "type": "gm_response",
                    "content": response
                })
                
                # Update encounter count (you might want to make this more sophisticated)
                manager.game_state["encounters"] += 1
                
                # Send updated stats
                await websocket.send_json({
                    "type": "state_update",
                    "players": len(manager.game_state["players"]),
                    "encounters": manager.game_state["encounters"],
                    "rolls": manager.game_state["rolls"]
                })
    
    except WebSocketDisconnect:
        # Handle disconnect
        pass
    except Exception as e:
        # Log the error and send error message to client
        logging.error(f"WebSocket error: {str(e)}")
        try:
            await websocket.send_json({
                "type": "system",
                "content": f"An error occurred: {str(e)}"
            })
        except:
            pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
