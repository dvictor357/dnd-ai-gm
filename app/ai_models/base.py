from abc import ABC, abstractmethod
from typing import Dict, List, Optional

class AIModel(ABC):
    @abstractmethod
    async def generate_response(
        self,
        message: str,
        system_prompt: str,
        character: Optional[Dict] = None,
        conversation_history: Optional[List[Dict]] = None
    ) -> str:
        """
        Generate a response from the AI model.
        
        Args:
            message: The user's message
            system_prompt: The system prompt to guide the AI's behavior
            character: Optional character information
            conversation_history: Optional list of previous conversation messages
            
        Returns:
            str: The generated response
        """
        pass
