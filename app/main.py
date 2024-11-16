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
        await websocket.accept()
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
    api_key = os.getenv('DEEPSEEK_API_KEY')
    if not api_key:
        raise ValueError("DEEPSEEK_API_KEY not found in environment variables")

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

    # Create character context if character info is provided
    character_context = ""
    if character:
        stats_info = character.get('stats', {})
        modifiers = {
            stat: (value - 10) // 2
            for stat, value in stats_info.items()
        }
        
        character_context = f"""
You are interacting with {character['name']}, a {character['race']} {character['class']} with a {character['background']} background.

Character Stats:
- Strength: {stats_info.get('strength', 10)} (modifier: {modifiers.get('strength', 0)})
- Dexterity: {stats_info.get('dexterity', 10)} (modifier: {modifiers.get('dexterity', 0)})
- Constitution: {stats_info.get('constitution', 10)} (modifier: {modifiers.get('constitution', 0)})
- Intelligence: {stats_info.get('intelligence', 10)} (modifier: {modifiers.get('intelligence', 0)})
- Wisdom: {stats_info.get('wisdom', 10)} (modifier: {modifiers.get('wisdom', 0)})
- Charisma: {stats_info.get('charisma', 10)} (modifier: {modifiers.get('charisma', 0)})

Consider these stats when suggesting ability checks, saving throws, and determining the success of actions. Address the character by name and consider their racial traits, class abilities, and background story elements in your responses."""

    # Prepare conversation history
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "system", "content": character_context} if character else None,
    ]

    # Add conversation history if available
    if conversation_history:
        for hist in conversation_history:
            if hist["type"] == "action":
                messages.append({"role": "user", "content": hist["content"]})
            elif hist["type"] == "gm_response":
                messages.append({"role": "assistant", "content": hist["content"]})

    # Add current message
    messages.append({"role": "user", "content": message})
    
    # Remove None messages
    messages = [msg for msg in messages if msg is not None]

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://api.deepseek.com/v1/chat/completions",
            json={
                "model": "deepseek-chat",
                "messages": messages,
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
            response_text = response_json['choices'][0]['message']['content']
            # Wrap any dice rolls in backticks
            return wrap_dice_rolls(response_text)

@app.get("/")
async def get():
    return {"status": "ok", "message": "D&D AI Game Master API is running"}

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