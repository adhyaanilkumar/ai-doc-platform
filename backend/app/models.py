from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    document_type = Column(String, nullable=False)  # "docx" or "pptx"
    main_topic = Column(Text, nullable=False)
    outline = Column(JSON, nullable=True)  # For docx: list of section headers
    slides = Column(JSON, nullable=True)  # For pptx: list of slide titles
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    owner = relationship("User", back_populates="projects")
    sections = relationship("Section", back_populates="project", cascade="all, delete-orphan")
    refinements = relationship("Refinement", back_populates="project", cascade="all, delete-orphan")

class Section(Base):
    __tablename__ = "sections"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    section_type = Column(String, nullable=False)  # "section" for docx, "slide" for pptx
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    project = relationship("Project", back_populates="sections")
    refinements = relationship("Refinement", back_populates="section", cascade="all, delete-orphan")

class Refinement(Base):
    __tablename__ = "refinements"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    prompt = Column(Text, nullable=False)
    original_content = Column(Text, nullable=False)
    refined_content = Column(Text, nullable=False)
    user_feedback = Column(String, nullable=True)  # "like", "dislike", or null
    user_comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    project = relationship("Project", back_populates="refinements")
    section = relationship("Section", back_populates="refinements")

