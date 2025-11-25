from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas, auth as auth_utils
from app.database import get_db

router = APIRouter()


def _sync_sections(db: Session, project: models.Project, titles: List[str], section_type: str):
    db.query(models.Section).filter(models.Section.project_id == project.id).delete()
    for idx, title in enumerate(titles):
        db.add(
            models.Section(
                project_id=project.id,
                section_type=section_type,
                title=title,
                order_index=idx,
            )
        )
    db.commit()


@router.get("/", response_model=List[schemas.ProjectResponse])
def list_projects(
    db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)
):
    return (
        db.query(models.Project)
        .filter(models.Project.user_id == current_user.id)
        .order_by(models.Project.created_at.desc())
        .all()
    )


@router.post("/", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    if project_data.document_type not in {"docx", "pptx"}:
        raise HTTPException(status_code=400, detail="Invalid document type")

    titles = project_data.outline if project_data.document_type == "docx" else project_data.slides
    if not titles:
        raise HTTPException(status_code=400, detail="At least one section/slide is required.")

    project = models.Project(
        user_id=current_user.id,
        title=project_data.title,
        document_type=project_data.document_type,
        main_topic=project_data.main_topic,
        outline=project_data.outline,
        slides=project_data.slides,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    section_type = "section" if project.document_type == "docx" else "slide"
    _sync_sections(db, project, titles, section_type)
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(
    project_id: int,
    project_data: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_payload = project_data.dict(exclude_unset=True)
    for key, value in update_payload.items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)

    titles = None
    if "outline" in update_payload and project.document_type == "docx":
        titles = project.outline or []
    if "slides" in update_payload and project.document_type == "pptx":
        titles = project.slides or []
    if titles is not None:
        section_type = "section" if project.document_type == "docx" else "slide"
        _sync_sections(db, project, titles, section_type)
        db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return None


@router.get("/{project_id}/sections", response_model=List[schemas.SectionResponse])
def list_project_sections(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    sections = (
        db.query(models.Section)
        .filter(models.Section.project_id == project.id)
        .order_by(models.Section.order_index.asc())
        .all()
    )
    return sections

