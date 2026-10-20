from sqlalchemy import Column, String, Integer, JSON
from app.database import Base

class Component(Base):
    __tablename__ = "components"

    id = Column(String(100), primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    short_description = Column(String(280), nullable=False)
    type = Column(String(50), nullable=False)  # "unit" | "assessment"
    approximate_duration_minutes = Column(Integer, nullable=False)
    metadata_json = Column(JSON, nullable=True)  # { assessment: {...} } or { unit: {...} }

