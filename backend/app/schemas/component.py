from typing import Optional, Literal
from pydantic import BaseModel, Field

class AssessmentMetadata(BaseModel):
    maxScore: int = Field(..., ge=1, le=10000)
    passingScore: int = Field(..., ge=0, le=10000)

class UnitMetadata(BaseModel):
    recommendedMinutes: Optional[int] = Field(None, ge=1, le=600)

class ComponentMetadata(BaseModel):
    assessment: Optional[AssessmentMetadata] = None
    unit: Optional[UnitMetadata] = None

class ComponentSchema(BaseModel):
    id: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=150)
    shortDescription: str = Field(..., min_length=1, max_length=280)
    type: Literal["unit", "assessment"]
    approximateDurationMinutes: int = Field(..., ge=1, le=600)
    metadata: Optional[ComponentMetadata] = None

class AvailableContentResponse(BaseModel):
    items: list[ComponentSchema]
    totalCount: int = Field(..., ge=0)

