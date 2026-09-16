from typing import List, Optional
from pydantic import BaseModel, Field

class ExtractedClaim(BaseModel):
    id: str
    text: str
    category: Optional[str] = "factual_claim"
    confidence: float = 0.95

class ExtractedAuthority(BaseModel):
    id: str
    name: str
    role: str
    department: str
    confidence: float = 0.90

class ExtractedConflict(BaseModel):
    id: str
    claim_text: str
    party_a: str
    party_b: str
    description: str
    status: str = "UNRESOLVED"

class ExtractedMissingInfo(BaseModel):
    id: str
    field_name: str
    description: str
    importance: str = "BLOCKING"
    action_required: str

class ExtractionResult(BaseModel):
    goal: str = Field(description="Primary citizen outcome desired")
    claims: List[ExtractedClaim] = Field(default_factory=list)
    authorities: List[ExtractedAuthority] = Field(default_factory=list)
    conflicts: List[ExtractedConflict] = Field(default_factory=list)
    missing_information: List[ExtractedMissingInfo] = Field(default_factory=list)
    suggested_workflows: List[str] = Field(default_factory=list)
    confidence: float = 0.92
    extractor_mode: str = "deterministic_rule_engine"
