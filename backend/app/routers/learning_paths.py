import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.learning_path import LearningPath
from app.schemas.learning_path import LearningPathSchema

router = APIRouter(prefix="/api/learning-paths", tags=["learning-paths"])

@router.get("", response_model=list[dict])
def list_learning_paths(db: Session = Depends(get_db)):
    """List all saved learning paths summary."""
    paths = db.query(LearningPath).order_by(LearningPath.updated_at.desc()).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "status": p.status,
            "version": p.version,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            "node_count": len(p.nodes) if isinstance(p.nodes, list) else 0,
            "edge_count": len(p.edges) if isinstance(p.edges, list) else 0
        }
        for p in paths
    ]

@router.post("", response_model=LearningPathSchema, status_code=status.HTTP_201_CREATED)
def save_learning_path(payload: LearningPathSchema, db: Session = Depends(get_db)):
    """Save or update a learning path built in the canvas."""
    path_id = payload.id if payload.id and payload.id.strip() else f"lp-{uuid.uuid4().hex[:8]}"

    existing = db.query(LearningPath).filter(LearningPath.id == path_id).first()

    nodes_data = [node.model_dump(exclude_none=True) for node in payload.nodes]
    edges_data = [edge.model_dump(exclude_none=True) for edge in payload.edges]
    canvas_data = payload.canvas.model_dump(exclude_none=True) if payload.canvas else None

    if existing:
        existing.name = payload.name
        existing.description = payload.description
        existing.status = payload.status
        existing.version = (existing.version or 1) + 1
        existing.canvas = canvas_data
        existing.nodes = nodes_data
        existing.edges = edges_data
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        target = existing
    else:
        new_path = LearningPath(
            id=path_id,
            name=payload.name,
            description=payload.description,
            status=payload.status,
            version=payload.version or 1,
            canvas=canvas_data,
            nodes=nodes_data,
            edges=edges_data,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(new_path)
        db.commit()
        db.refresh(new_path)
        target = new_path

    return LearningPathSchema(
        id=target.id,
        name=target.name,
        description=target.description,
        status=target.status,
        version=target.version,
        canvas=target.canvas,
        nodes=target.nodes,
        edges=target.edges
    )

@router.get("/{id}", response_model=LearningPathSchema)
def get_learning_path(id: str, db: Session = Depends(get_db)):
    """Load a previously saved learning path."""
    path = db.query(LearningPath).filter(LearningPath.id == id).first()
    if not path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning path with ID '{id}' not found."
        )

    return LearningPathSchema(
        id=path.id,
        name=path.name,
        description=path.description,
        status=path.status,
        version=path.version,
        canvas=path.canvas,
        nodes=path.nodes,
        edges=path.edges
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_learning_path(id: str, db: Session = Depends(get_db)):
    """Delete a saved learning path."""
    path = db.query(LearningPath).filter(LearningPath.id == id).first()
    if not path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning path with ID '{id}' not found."
        )
    db.delete(path)
    db.commit()
    return None

