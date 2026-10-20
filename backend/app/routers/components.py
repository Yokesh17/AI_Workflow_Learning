from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.component import Component
from app.schemas.component import AvailableContentResponse, ComponentSchema

router = APIRouter(prefix="/api/components", tags=["components"])

@router.get("", response_model=AvailableContentResponse)
def get_available_components(db: Session = Depends(get_db)):
    """Return all draggable content for the left-side panel matching available-content.schema.json."""
    db_items = db.query(Component).all()
    items = []
    for c in db_items:
        items.append(
            ComponentSchema(
                id=c.id,
                title=c.title,
                shortDescription=c.short_description,
                type=c.type,
                approximateDurationMinutes=c.approximate_duration_minutes,
                metadata=c.metadata_json
            )
        )
    return AvailableContentResponse(items=items, totalCount=len(items))

