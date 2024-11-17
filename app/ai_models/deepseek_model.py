import os
import logging
import aiohttp
from typing import Dict, List, Optional
from .base import AIModel

class DeepSeekModel(AIModel):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('DEEPSEEK_API_KEY')
        if not self.api_key:
            raise ValueError("DEEPSEEK_API_KEY not found in environment variables")

    async def generate_response(
        self,
        message: str,
        system_prompt: str,
        character: Optional[Dict] = None,
        conversation_history: Optional[List[Dict]] = None
    ) -> str:
        # Prepare messages
        messages = [{"role": "system", "content": system_prompt}]

        # Add character context if provided
        if character:
            character_context = self._create_character_context(character)
            messages.append({"role": "system", "content": character_context})

        # Add conversation history
        if conversation_history:
            for hist in conversation_history[-10:]:  # Keep last 10 messages
                if hist["type"] == "action":
                    messages.append({"role": "user", "content": hist["content"]})
                elif hist["type"] == "gm_response":
                    messages.append({"role": "assistant", "content": hist["content"]})

        # Add current message
        messages.append({"role": "user", "content": message})
        messages = [msg for msg in messages if msg is not None]

        # Make API request
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
                response = await self._make_api_request(session, messages)
                return response
        except Exception as e:
            logging.error(f"Error generating response: {str(e)}")
            return "I apologize, but I'm having trouble processing your request at the moment. Please try again."

    def _create_character_context(self, character: Dict) -> str:
        stats_info = character.get('stats', {})
        modifiers = {
            stat: (value - 10) // 2
            for stat, value in stats_info.items()
        }
        
        return f"""
You are interacting with {character['name']}, a {character['race']} {character['class']} with a {character['background']} background.

Character Stats:
- Strength: {stats_info.get('strength', 10)} (modifier: {modifiers.get('strength', 0)})
- Dexterity: {stats_info.get('dexterity', 10)} (modifier: {modifiers.get('dexterity', 0)})
- Constitution: {stats_info.get('constitution', 10)} (modifier: {modifiers.get('constitution', 0)})
- Intelligence: {stats_info.get('intelligence', 10)} (modifier: {modifiers.get('intelligence', 0)})
- Wisdom: {stats_info.get('wisdom', 10)} (modifier: {modifiers.get('wisdom', 0)})
- Charisma: {stats_info.get('charisma', 10)} (modifier: {modifiers.get('charisma', 0)})

Consider these stats when suggesting ability checks, saving throws, and determining the success of actions. Address the character by name and consider their racial traits, class abilities, and background story elements in your responses."""

    async def _make_api_request(self, session: aiohttp.ClientSession, messages: List[Dict]) -> str:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

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
                logging.error(f"API request failed with status {response.status}: {error_text}")
                return "I apologize, but I'm having trouble processing your request at the moment. Please try again."
            
            response_json = await response.json()
            return response_json['choices'][0]['message']['content']
