from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.dependencies import get_db
from app.models.game_models import GameRoom, User
from app.schemas.game_room_schema import GameRoomCreate, GameRoomResponse, GameRoomUpdate

router = APIRouter(prefix="/game-rooms", tags=["game-rooms"])

@router.post("/", response_model=GameRoomResponse)
async def create_game_room(
    game_room: GameRoomCreate,
    owner_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Create a new game room."""
    # Verify owner exists
    owner = await db.execute(select(User).filter(User.id == owner_id))
    if not owner.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Owner not found")
    
    db_game_room = GameRoom(
        id=str(uuid.uuid4()),
        name=game_room.name,
        description=game_room.description,
        max_players=game_room.max_players,
        game_type=game_room.game_type,
        settings=game_room.settings,
        owner_id=owner_id,
        active=True
    )
    db.add(db_game_room)
    await db.commit()
    await db.refresh(db_game_room)
    return db_game_room

@router.get("/", response_model=List[GameRoomResponse])
async def get_game_rooms(
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """Get all game rooms."""
    query = select(GameRoom)
    if active_only:
        query = query.filter(GameRoom.active == True)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{room_id}", response_model=GameRoomResponse)
async def get_game_room(room_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific game room by ID."""
    result = await db.execute(
        select(GameRoom).filter(GameRoom.id == room_id)
    )
    room = result.scalar_one_or_none()
    if room is None:
        raise HTTPException(status_code=404, detail="Game room not found")
    return room

@router.patch("/{room_id}", response_model=GameRoomResponse)
async def update_game_room(
    room_id: str,
    game_room: GameRoomUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a game room."""
    result = await db.execute(
        select(GameRoom).filter(GameRoom.id == room_id)
    )
    db_game_room = result.scalar_one_or_none()
    if db_game_room is None:
        raise HTTPException(status_code=404, detail="Game room not found")
    
    # Update fields if provided
    for field, value in game_room.dict(exclude_unset=True).items():
        setattr(db_game_room, field, value)
    
    await db.commit()
    await db.refresh(db_game_room)
    return db_game_room

@router.delete("/{room_id}", response_model=GameRoomResponse)
async def delete_game_room(room_id: str, db: AsyncSession = Depends(get_db)):
    """Soft delete a game room (set active=False)."""
    result = await db.execute(
        select(GameRoom).filter(GameRoom.id == room_id)
    )
    db_game_room = result.scalar_one_or_none()
    if db_game_room is None:
        raise HTTPException(status_code=404, detail="Game room not found")
    
    db_game_room.active = False
    await db.commit()
    await db.refresh(db_game_room)
    return db_game_room

@router.post("/{room_id}/join/{user_id}", response_model=GameRoomResponse)
async def join_game_room(
    room_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Join a game room."""
    # Get the room and user
    room_result = await db.execute(select(GameRoom).filter(GameRoom.id == room_id))
    room = room_result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Game room not found")
    
    user_result = await db.execute(select(User).filter(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if room is active
    if not room.active:
        raise HTTPException(status_code=400, detail="Game room is not active")
    
    # Check if room is full
    if len(room.current_players) >= room.max_players:
        raise HTTPException(status_code=400, detail="Game room is full")
    
    # Add user to room if not already in
    if user not in room.current_players:
        room.current_players.append(user)
        await db.commit()
        await db.refresh(room)
    
    return room

@router.post("/{room_id}/leave/{user_id}", response_model=GameRoomResponse)
async def leave_game_room(
    room_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Leave a game room."""
    # Get the room and user
    room_result = await db.execute(select(GameRoom).filter(GameRoom.id == room_id))
    room = room_result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Game room not found")
    
    user_result = await db.execute(select(User).filter(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove user from room if present
    if user in room.current_players:
        room.current_players.remove(user)
        await db.commit()
        await db.refresh(room)
    
    return room
