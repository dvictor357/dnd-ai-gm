from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
import json
import os
import aiohttp
import asyncio
import logging
import re
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime

# Add project root to Python path
import sys
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.ai_models import AIModelFactory

# Load environment variables
load_dotenv()

# Initialize AI model
ai_model = AIModelFactory.create_model(os.getenv('AI_MODEL', 'deepseek'))

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

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.game_state = {
            "players": {},  # Store player info
            "encounters": 0,
            "rolls": 0,
            "conversations": {}  # Store conversation history per player
        }

    async def connect(self, websocket: WebSocket, player_id: str):
        self.active_connections[player_id] = websocket
        self.game_state["players"][player_id] = {
            "joined_at": datetime.now().isoformat()
        }
        self.game_state["conversations"][player_id] = []

    def disconnect(self, player_id: str):
        if player_id in self.active_connections:
            del self.active_connections[player_id]
        if player_id in self.game_state["players"]:
            del self.game_state["players"][player_id]
        if player_id in self.game_state["conversations"]:
            del self.game_state["conversations"][player_id]

    def add_to_conversation(self, player_id: str, message: dict):
        if player_id not in self.game_state["conversations"]:
            self.game_state["conversations"][player_id] = []
        self.game_state["conversations"][player_id].append(message)
        # Keep only last 10 messages for context
        self.game_state["conversations"][player_id] = self.game_state["conversations"][player_id][-10:]

    def get_player_count(self):
        return len(self.active_connections)

    def increment_encounters(self):
        self.game_state["encounters"] += 1
        return self.game_state["encounters"]

    def increment_rolls(self):
        self.game_state["rolls"] += 1
        return self.game_state["rolls"]

manager = ConnectionManager()

def wrap_dice_rolls(text):
    # Pattern to match dice roll notation [XdY+Z] or [XdY-Z] or [dY]
    pattern = r'\[(\d*d\d+(?:[+-]\d+)?)\]'
    
    # Replace each match with the same text wrapped in backticks
    return re.sub(pattern, r'`[\1]`', text)

async def get_ai_response(message: str, character: dict = None, conversation_history: list = None) -> str:
    system_prompt = """You are an AI Dungeon Master for a D&D 5e game. Guide players through their adventure while following these strict formatting guidelines:

1. **Message Structure**:
   Each response should include a mix of:
   - *Atmospheric descriptions* in italics
   - Character or NPC dialogue in quotes
   - **Game mechanics** in bold
   - Location and character name tags
   - Dice roll notations where appropriate

2. **Required Formatting Tags**:
   - Locations: Use #location_name# (e.g., #The Misty Tavern#)
   - Characters/NPCs: Use @character_name@ (e.g., @Eldric the Wise@)
   - Dialogue: Use "quotes" for all spoken text
   - Dice Rolls: Use `[XdY+Z]` format (e.g., `[d20+5]`, `[2d6]`)
   - Important Actions/Terms: Use **bold**
   - Descriptions/Atmosphere: Use *italics*

3. **Formatting Examples**:
   *The ancient stone walls of* #Ravenspire Keep# *echo with distant footsteps.*
   
   @Guard Captain Helena@ *stands at attention, her armor gleaming in the torchlight.* "State your business, travelers," *she commands firmly.*
   
   **Make a Charisma (Persuasion) check** `[d20+3]` *to convince her of your peaceful intentions.*

4. **Game Mechanics**:
   - Use D&D 5e rules consistently
   - Include appropriate ability checks and saving throws
   - Standard DC scale: Easy (10), Medium (15), Hard (20)
   - Consider character stats and proficiencies
   - Track initiative and combat turns

5. **Interaction Guidelines**:
   - Maintain consistent narrative tone
   - Provide clear choices and consequences
   - React dynamically to player decisions
   - Balance roleplay, combat, and exploration
   - Keep responses focused and engaging

Remember: Every location must use #tags#, every character must use @tags@, all dialogue must use "quotes", and all dice rolls must use `[brackets]`. These formatting rules are crucial for proper message display in the interface."""

    try:
        response = await ai_model.generate_response(
            message=message,
            system_prompt=system_prompt,
            character=character,
            conversation_history=conversation_history
        )
        return wrap_dice_rolls(response)
    except Exception as e:
        logging.error(f"Error in get_ai_response: {str(e)}")
        return "I apologize, but I'm having trouble processing your request at the moment. Please try again."

@app.get("/")
async def get():
    return {"status": "ok", "message": "D&D AI Game Master API is running"}

@app.get("/server-info")
async def get_server_info():
    # Get server start time from a global variable or environment
    start_time = getattr(app.state, 'start_time', datetime.now())
    if not hasattr(app.state, 'start_time'):
        app.state.start_time = start_time

    # Calculate uptime
    uptime = datetime.now() - start_time
    hours, remainder = divmod(int(uptime.total_seconds()), 3600)
    minutes, seconds = divmod(remainder, 60)
    uptime_str = f"{hours}h {minutes}m {seconds}s"

    return {
        "status": "online",
        "version": "1.0.0",
        "uptime": uptime_str,
        "active_players": len(manager.active_connections),
        "total_encounters": manager.game_state["encounters"],
        "total_rolls": manager.game_state["rolls"]
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "character_created":
                char_data = data["data"]
                player_id = f"{char_data['name']}_{datetime.now().timestamp()}"
                
                # Initialize player data
                await manager.connect(websocket, player_id)
                manager.game_state["players"][player_id].update(char_data)
                
                # Send welcome message
                await websocket.send_json({
                    "type": "system",
                    "content": f"Welcome, {char_data['name']} the {char_data['race']} {char_data['class']}! Your adventure begins..."
                })
                
                # Get initial AI response to start the adventure
                initial_prompt = f"Begin a new adventure for {char_data['name']}, a {char_data['race']} {char_data['class']} with a {char_data['background']} background. Set the scene and give them their first choice of action."
                
                response = await get_ai_response(
                    message=initial_prompt,
                    character=char_data
                )
                
                # Add GM's response to conversation history
                manager.add_to_conversation(player_id, {
                    "type": "gm_response",
                    "content": response
                })
                
                # Send the initial scene to the player
                await websocket.send_json({
                    "type": "gm_response",
                    "content": response
                })
                
                # Update all clients with new player count
                await websocket.send_json({
                    "type": "state_update",
                    "players": len(manager.game_state["players"]),
                    "encounters": manager.game_state["encounters"],
                    "rolls": manager.game_state["rolls"]
                })
            
            elif data["type"] == "roll":
                # Increment roll count
                manager.increment_rolls()
                
                # Send updated stats
                await websocket.send_json({
                    "type": "state_update",
                    "players": len(manager.game_state["players"]),
                    "encounters": manager.game_state["encounters"],
                    "rolls": manager.game_state["rolls"]
                })
            
            elif data["type"] == "action":
                player_id = None
                # Find player ID based on character data
                if "character" in data:
                    char_name = data["character"]["name"]
                    for pid, pdata in manager.game_state["players"].items():
                        if pdata.get("name") == char_name:
                            player_id = pid
                            break

                if player_id:
                    # Add player's message to conversation history
                    manager.add_to_conversation(player_id, {
                        "type": "action",
                        "content": data["content"]
                    })

                    # Get conversation history
                    conversation_history = manager.game_state["conversations"].get(player_id, [])

                    # Get AI response with character context and conversation history
                    response = await get_ai_response(
                        message=data["content"],
                        character=data.get("character"),
                        conversation_history=conversation_history
                    )

                    # Add GM's response to conversation history
                    manager.add_to_conversation(player_id, {
                        "type": "gm_response",
                        "content": response
                    })
                    
                    # Send response back to client
                    await websocket.send_json({
                        "type": "gm_response",
                        "content": response
                    })
                    
                    # Update encounter count
                    manager.game_state["encounters"] += 1
                    
                    # Send updated stats
                    await websocket.send_json({
                        "type": "state_update",
                        "players": len(manager.game_state["players"]),
                        "encounters": manager.game_state["encounters"],
                        "rolls": manager.game_state["rolls"]
                    })
            
            elif data["type"] == "end_game":
                # Find player ID based on character data
                if "character" in data:
                    char_name = data["character"]["name"]
                    player_id = None
                    for pid, pdata in manager.game_state["players"].items():
                        if pdata.get("name") == char_name:
                            player_id = pid
                            break
                    
                    if player_id:
                        # Clean up player data
                        manager.disconnect(player_id)
                        
                        # Send confirmation message
                        await websocket.send_json({
                            "type": "system",
                            "content": f"Farewell, {char_name}! Your adventure has ended."
                        })
                        
                        # Update all clients with new player count
                        await websocket.send_json({
                            "type": "state_update",
                            "players": len(manager.game_state["players"]),
                            "encounters": manager.game_state["encounters"],
                            "rolls": manager.game_state["rolls"]
                        })
    
    except WebSocketDisconnect:
        # Find and clean up disconnected player's data
        for pid, ws in manager.active_connections.items():
            if ws == websocket:
                manager.disconnect(pid)
                break
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