from sqlalchemy import Column, String, DateTime, JSON, Enum, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    active_room_id = Column(UUID(as_uuid=True), ForeignKey("game_rooms.id"), nullable=True)
    
    # Relationships
    characters = relationship("Character", back_populates="user")
    messages = relationship("Message", back_populates="sender")
    active_room = relationship("GameRoom", back_populates="active_users")

class GameRoom(Base):
    __tablename__ = "game_rooms"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    status = Column(Enum("active", "paused", "completed", name="room_status"), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    dm_settings = Column(JSON, nullable=False, default=dict)
    
    # Relationships
    active_users = relationship("User", back_populates="active_room")
    characters = relationship("Character", back_populates="room")
    sessions = relationship("GameSession", back_populates="room")

class Character(Base):
    __tablename__ = "characters"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    room_id = Column(UUID(as_uuid=True), ForeignKey("game_rooms.id"), nullable=False)
    name = Column(String, nullable=False)
    class_type = Column(String, nullable=False)
    level = Column(Integer, default=1)
    stats = Column(JSON, nullable=False)
    inventory = Column(JSON, nullable=False, default=list)
    
    # Relationships
    user = relationship("User", back_populates="characters")
    room = relationship("GameRoom", back_populates="characters")

class GameSession(Base):
    __tablename__ = "game_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = Column(UUID(as_uuid=True), ForeignKey("game_rooms.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    scene_state = Column(JSON, nullable=False, default=dict)
    
    # Relationships
    room = relationship("GameRoom", back_populates="sessions")
    messages = relationship("Message", back_populates="session")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("game_sessions.id"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    message_type = Column(
        Enum("action", "speech", "gm_response", "system", name="message_type"),
        nullable=False
    )
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("GameSession", back_populates="messages")
    sender = relationship("User", back_populates="messages")
