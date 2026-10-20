from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.learning_path import LearningPath
from app.schemas.learning_path import EvaluateRequest, EvaluateResponse, AIReviewResponse, LearningPathSchema
from app.agent.graph import run_evaluation
from app.agent.review import generate_workflow_ai_review

router = APIRouter(prefix="/api/learning-paths", tags=["evaluation"])

@router.post("/{id}/evaluate", response_model=EvaluateResponse)
def evaluate_learning_path_node(id: str, request: EvaluateRequest, db: Session = Depends(get_db)):
    """Evaluate next node using learner context via the LangGraph adaptive agent."""
    path = db.query(LearningPath).filter(LearningPath.id == id).first()
    if not path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning path with ID '{id}' not found."
        )

    nodes = path.nodes or []
    edges = path.edges or []

    # Run LangGraph pipeline
    result = run_evaluation(
        path_id=id,
        current_node_id=request.currentNodeId,
        learner_context=request.learnerContext,
        nodes=nodes,
        edges=edges
    )

    return EvaluateResponse(
        pathId=id,
        currentNodeId=request.currentNodeId,
        nextNodeId=result.get("next_node_id"),
        matchedEdgeId=result.get("matched_edge_id"),
        reasoning=result.get("reasoning", ""),
        evaluationMode=result.get("evaluation_mode", "deterministic")
    )

@router.post("/{id}/ai-review", response_model=AIReviewResponse)
def review_learning_path_workflow(id: str, db: Session = Depends(get_db)):
    """Generate an AI-driven and structural review of the complete curriculum workflow."""
    path = db.query(LearningPath).filter(LearningPath.id == id).first()
    if not path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning path with ID '{id}' not found."
        )

    nodes = path.nodes or []
    edges = path.edges or []
    return generate_workflow_ai_review(
        path_id=id,
        path_name=path.name or "Untitled Learning Path",
        nodes=nodes,
        edges=edges
    )

@router.post("/draft/ai-review", response_model=AIReviewResponse)
def review_draft_learning_path_workflow(payload: LearningPathSchema):
    """Generate an AI review for an in-memory draft learning path."""
    return generate_workflow_ai_review(
        path_id=payload.id or "draft",
        path_name=payload.name,
        nodes=[n.model_dump() for n in payload.nodes],
        edges=[e.model_dump() for e in payload.edges]
    )

