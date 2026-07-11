from pydantic import BaseModel, Field


class LintInput(BaseModel):
    content: str = Field(..., min_length=1)


class LintIssue(BaseModel):
    type: str
    message: str
    suggestion: str


class LintResponse(BaseModel):
    issues: list[LintIssue]
    rag_context: list[str]
