import os
import logging
import aiohttp
import re
from typing import Dict, List, Optional
from .base import AIModel

class OpenRouterModel(AIModel):
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        """
        Initialize OpenRouter model.
        
        Args:
            api_key: OpenRouter API key. If not provided, will look for OPENROUTER_API_KEY env var
            model_name: Name of the model to use. If not provided, will look for OPENROUTER_MODEL env var,
                      then fall back to default model
        """
        self.api_key = api_key or os.getenv('OPENROUTER_API_KEY')
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not found in environment variables")
            
        # Try to get model from env var, fall back to default if not specified
        self.model_name = (
            model_name or 
            os.getenv('OPENROUTER_MODEL') or 
            "anthropic/claude-2"
        )

    async def generate_response(
        self,
        message: str,
        system_prompt: str,
        character: Optional[Dict] = None,
        conversation_history: Optional[List[Dict]] = None
    ) -> str:
        # Add formatting reinforcement to system prompt
        enhanced_prompt = self._enhance_system_prompt(system_prompt)
        
        # Prepare messages
        messages = [{"role": "system", "content": enhanced_prompt}]

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

        # Add formatting reminder before user message
        messages.append({
            "role": "system",
            "content": "Remember to use proper formatting:\n- Locations in #tags#\n- Characters in @tags@\n- Dialogue in \"quotes\"\n- Descriptions in *italics*\n- Game mechanics in **bold**\n- Dice rolls in `[XdY+Z]`"
        })

        # Add current message
        messages.append({"role": "user", "content": message})
        messages = [msg for msg in messages if msg is not None]

        # Make API request
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
                response = await self._make_api_request(session, messages)
                # Post-process the response to ensure proper formatting
                formatted_response = self._ensure_formatting(response)
                return formatted_response
        except Exception as e:
            logging.error(f"Error generating response: {str(e)}")
            return "I apologize, but I'm having trouble processing your request at the moment. Please try again."

    def _enhance_system_prompt(self, system_prompt: str) -> str:
        """Add additional formatting instructions to the system prompt."""
        extra_instructions = """

IMPORTANT: You must strictly follow these formatting rules for EVERY response:
1. ALWAYS wrap location names in #hashtags#
2. ALWAYS wrap character/NPC names in @at-signs@
3. ALWAYS wrap dialogue in "double quotes"
4. ALWAYS wrap atmospheric descriptions in *asterisks*
5. ALWAYS wrap game mechanics and rules in **double asterisks**
6. ALWAYS format dice rolls as `[XdY+Z]` in backticks

Example of a properly formatted response:
*The torches flicker in* #The Dragon's Rest Tavern# *as* @Bartender Gorm@ *wipes down the counter.*
"What brings you to our humble establishment?" *he asks with a gruff voice.*
**To learn more about the local rumors, make a Charisma (Persuasion) check** `[d20+2]`

Your response MUST include ALL these formatting elements."""

        return system_prompt + extra_instructions

    def _ensure_formatting(self, text: str) -> str:
        """Post-process the response to ensure proper formatting."""
        # List of common formatting fixes
        fixes = [
            # Fix location tags
            (r'(?<![#\w])(the )?([A-Z][a-zA-Z\' ]+(?:Tavern|Inn|Castle|Keep|Forest|Cave|Temple|Tower|City|Town|Village|Market|Square|Gate|Bridge|River|Mountain|Valley|Road|Path|Guild|Shop|Store|Hall|Throne|Chamber|Room|Dungeon|Lair|Haven|Sanctum|Arena|Port|Bay|Sea|Lake|Woods|Grove|Sanctuary|Tomb|Crypt|Mine|Camp|Fort|Fortress|Palace|Cathedral|Abbey|Monastery|Shrine|Outpost|Settlement|Quarter|District|Slums|Docks|Garden|Park|Academy|School|Library|Museum|Theater|Arena|Barracks|Prison|Jail|Embassy|Manor|Estate|Villa|Cottage|Farm|Mill|Smithy|Forge|Workshop|Laboratory|Observatory|Lighthouse|Windmill|Warehouse|Market|Bazaar|Fair|Festival|Carnival|Circus|Stadium|Colosseum|Amphitheater))\b(?![#\w])', r'#\2#'),
            
            # Fix character tags
            (r'(?<![@\w])(the )?((?:Lord|Lady|King|Queen|Prince|Princess|Duke|Duchess|Baron|Baroness|Count|Countess|Sir|Dame|Captain|Commander|General|Admiral|Wizard|Mage|Sorcerer|Warlock|Cleric|Priest|Priestess|Bishop|Archbishop|Pope|Emperor|Empress|Merchant|Trader|Innkeeper|Blacksmith|Guard|Soldier|Knight|Squire|Page|Ranger|Hunter|Tracker|Scout|Rogue|Thief|Assassin|Bard|Minstrel|Healer|Doctor|Alchemist|Scholar|Sage|Master|Apprentice|Elder|Chief|Leader|Warrior|Fighter|Paladin|Monk|Druid|Shaman|Necromancer|Summoner|Enchanter|Artificer|Smith|Craftsman|Artist|Performer|Dancer|Singer|Actor|Messenger|Courier|Servant|Slave|Peasant|Farmer|Fisherman|Miner|Logger|Hunter|Trapper|Sailor|Pirate|Bandit|Mercenary|Gladiator|Champion|Hero|Villain|Dragon|Giant|Troll|Ogre|Orc|Goblin|Hobgoblin|Kobold|Gnoll|Bugbear|Minotaur|Centaur|Satyr|Fairy|Pixie|Sprite|Nymph|Dryad|Unicorn|Phoenix|Griffin|Hippogriff|Pegasus|Wyvern|Basilisk|Chimera|Hydra|Kraken|Leviathan|Demon|Devil|Angel|Celestial|Elemental|Ghost|Spirit|Wraith|Specter|Vampire|Werewolf|Zombie|Skeleton|Lich|Mummy|Golem|Construct|Elemental|Outsider|Aberration|Monster|Beast|Creature) [A-Z][a-zA-Z\' ]+)\b(?![@\w])', r'@\2@'),
            
            # Ensure dialogue is in quotes
            (r'(?<!")([A-Z][^\.!?\n]*(?:[\.,!?]+|[:,] "|"))(?!")', r'"\1"'),
            
            # Ensure game mechanics are bold
            (r'(?<!\*\*)(Make an? (?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)(?: \([A-Za-z]+\))? (?:check|save|saving throw|ability check)(?:\.|,)?|DC \d+|Initiative|Attack Roll|Damage Roll)(?!\*\*)', r'**\1**'),
            
            # Fix dice roll formatting
            (r'(?<!`)\[(d20|[1-9]\d*d(?:4|6|8|10|12|20|100)(?:[+-][1-9]\d*)?)\](?!`)', r'`[\1]`'),
            
            # Ensure descriptions are in italics
            (r'(?<!\*)((?:(?:The|A|An) )?(?:air|room|chamber|area|space|atmosphere|environment) (?:is|feels|seems|appears|becomes) [^\.!?\n]+[\.!?])(?!\*)', r'*\1*')
        ]
        
        result = text
        for pattern, replacement in fixes:
            result = re.sub(pattern, replacement, result)
        
        return result

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
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://github.com/dvictor357/dnd-ai-gm",
            "X-Title": "DnD AI GM"
        }

        async with session.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json={
                "model": self.model_name,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 800,
            },
            headers=headers
        ) as response:
            if response.status != 200:
                error_text = await response.text()
                logging.error(f"API request failed with status {response.status}: {error_text}")
                return "I apologize, but I'm having trouble processing your request at the moment. Please try again."
            
            response_json = await response.json()
            return response_json['choices'][0]['message']['content']
