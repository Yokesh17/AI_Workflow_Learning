from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, JSON
from app.database import Base

class LearningPath(Base):
    __tablename__ = "learning_paths"

    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(String(1000), nullable=True)
    status = Column(String(20), default="draft", nullable=False)  # "draft" | "published"
    version = Column(Integer, default=1, nullable=False)
    canvas = Column(JSON, nullable=True)  # { zoom, offsetX, offsetY }
    nodes = Column(JSON, nullable=False)   # List of nodes
    edges = Column(JSON, nullable=False)   # List of edges
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

