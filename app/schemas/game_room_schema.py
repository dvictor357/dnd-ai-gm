from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from .user_schema import UserResponse

class GameRoomBase(BaseModel):
    name: str
    description: Optional[str] = None
    max_players: int = 6
    game_type: str = "D&D 5E"
    settings: Optional[Dict] = None

class GameRoomCreate(GameRoomBase):
    pass

class GameRoomUpdate(GameRoomBase):
    name: Optional[str] = None
    max_players: Optional[int] = None
    game_type: Optional[str] = None

class GameRoomResponse(GameRoomBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: Optional[datetime]
    active: bool
    current_players: Optional[List[UserResponse]] = []
    
    class Config:
        from_attributes = True
