from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime

# User schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        return v

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Project schemas
class ProjectCreate(BaseModel):
    title: str
    document_type: str  # "docx" or "pptx"
    main_topic: str
    outline: Optional[List[str]] = None  # For docx
    slides: Optional[List[str]] = None  # For pptx

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    main_topic: Optional[str] = None
    outline: Optional[List[str]] = None
    slides: Optional[List[str]] = None

class ProjectResponse(BaseModel):
    id: int
    user_id: int
    title: str
    document_type: str
    main_topic: str
    outline: Optional[List[str]]
    slides: Optional[List[str]]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Section schemas
class SectionCreate(BaseModel):
    title: str
    content: Optional[str] = None
    order_index: int

class SectionResponse(BaseModel):
    id: int
    project_id: int
    section_type: str
    title: str
    content: Optional[str]
    order_index: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Refinement schemas
class RefinementRequest(BaseModel):
    section_id: int
    prompt: str

class RefinementFeedback(BaseModel):
    refinement_id: int
    feedback: Optional[str] = None  # "like" or "dislike"
    comment: Optional[str] = None

class RefinementResponse(BaseModel):
    id: int
    project_id: int
    section_id: int
    prompt: str
    original_content: str 
    refined_content: str
    user_feedback: Optional[str]
    user_comment: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Document generation schemas
class GenerateContentRequest(BaseModel):
    project_id: int

class AITemplateRequest(BaseModel):
    document_type: str
    main_topic: str

class AITemplateResponse(BaseModel):
    outline: Optional[List[str]] = None
    slides: Optional[List[str]] = None

