from typing import Optional, Literal, Union, Any
from pydantic import BaseModel, Field, model_validator

class PositionSchema(BaseModel):
    x: float
    y: float

class NodeConfigAssessment(BaseModel):
    maxScore: int = Field(..., ge=1, le=10000)
    passingScore: int = Field(..., ge=0, le=10000)

class NodeConfigSchema(BaseModel):
    approximateDurationMinutes: Optional[int] = Field(None, ge=0, le=600)
    questionsCount: Optional[int] = Field(None, ge=0, le=1000)
    difficulty: Optional[str] = "Medium"
    isGroup: Optional[bool] = False
    parentGroupId: Optional[str] = None
    assessment: Optional[NodeConfigAssessment] = None

    class Config:
        extra = "allow"

class NodeSchema(BaseModel):
    id: str = Field(..., min_length=1, max_length=100)
    componentId: str = Field(..., min_length=1, max_length=100)
    type: Literal["start", "unit", "assessment", "end"]
    label: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    position: PositionSchema
    config: Optional[NodeConfigSchema] = None

class RuleRangeSchema(BaseModel):
    min: float
    max: float
    minInclusive: Optional[bool] = True
    maxInclusive: Optional[bool] = True

class RuleSchema(BaseModel):
    id: str = Field(..., min_length=1, max_length=100)
    sourceType: Literal["assessment", "unit"]
    sourceNodeId: str = Field(..., min_length=1, max_length=100)
    metric: Literal[
        "completion",
        "passed",
        "score",
        "score_range",
        "time_spent_minutes",
        "percentage_completion"
    ]
    operator: Literal["eq", "ne", "gt", "gte", "lt", "lte", "between"]
    value: Optional[Union[bool, float, int, str]] = None
    range: Optional[RuleRangeSchema] = None

    @model_validator(mode="after")
    def validate_rule_constraints(self):
        if self.sourceType == "assessment":
            allowed_assessment_metrics = {"completion", "passed", "score", "score_range"}
            if self.metric not in allowed_assessment_metrics:
                raise ValueError(
                    f"Metric '{self.metric}' is not allowed for assessment source nodes. "
                    f"Allowed metrics: {sorted(list(allowed_assessment_metrics))}"
                )
        elif self.sourceType == "unit":
            allowed_unit_metrics = {"completion", "time_spent_minutes", "percentage_completion"}
            if self.metric not in allowed_unit_metrics:
                raise ValueError(
                    f"Metric '{self.metric}' is not allowed for unit source nodes. "
                    f"Allowed metrics: {sorted(list(allowed_unit_metrics))}"
                )

        if self.operator == "between" or self.metric == "score_range":
            if self.range is None:
                raise ValueError("range is required when operator is 'between' or metric is 'score_range'")
        return self

class ConditionsSchema(BaseModel):
    operator: Literal["AND", "OR"] = "AND"
    rules: list[RuleSchema] = []

class EdgeSchema(BaseModel):
    id: str = Field(..., min_length=1, max_length=100)
    sourceNodeId: str = Field(..., min_length=1, max_length=100)
    targetNodeId: str = Field(..., min_length=1, max_length=100)
    label: Optional[str] = Field(None, max_length=150)
    priority: Optional[int] = Field(1, ge=1)
    isDefault: Optional[bool] = False
    conditions: ConditionsSchema

class CanvasSchema(BaseModel):
    zoom: Optional[float] = Field(1.0, ge=0.1, le=4.0)
    offsetX: Optional[float] = 0.0
    offsetY: Optional[float] = 0.0

class LearningPathSchema(BaseModel):
    id: Optional[str] = Field(None, min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    status: Literal["draft", "published"] = "draft"
    version: Optional[int] = Field(1, ge=1)
    canvas: Optional[CanvasSchema] = None
    nodes: list[NodeSchema]
    edges: list[EdgeSchema]

class EvaluateRequest(BaseModel):
    currentNodeId: str
    learnerContext: dict[str, Any]  # e.g., {"score": 45, "completion": True, "passed": False, "time_spent_minutes": 30}

class EvaluateResponse(BaseModel):
    pathId: str
    currentNodeId: str
    nextNodeId: Optional[str]
    matchedEdgeId: Optional[str]
    reasoning: str
    evaluationMode: str  # "langgraph-llm" | "deterministic"

class AIReviewResponse(BaseModel):
    pathId: str
    pathName: str
    overallScore: int
    status: str
    structuralHealth: dict[str, Any]
    metrics: dict[str, Any]
    curriculumAnalysis: str
    recommendations: list[str]
    modelUsed: str

