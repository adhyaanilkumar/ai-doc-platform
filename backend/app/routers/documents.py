from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
from app import models, schemas, auth as auth_utils
from app.database import get_db
from app.services.ai_service import get_ai_service
from app.services import document_builder

router = APIRouter()


def _get_project(db: Session, project_id: int, user_id: int) -> models.Project:
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.user_id == user_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/template", response_model=schemas.AITemplateResponse)
def ai_template_suggestion(
    request: schemas.AITemplateRequest,
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    ai_client = get_ai_service()
    headings = ai_client.suggest_outline(request.document_type, request.main_topic)
    if request.document_type == "docx":
        return schemas.AITemplateResponse(outline=headings)
    return schemas.AITemplateResponse(slides=headings)


@router.post("/generate", response_model=List[schemas.SectionResponse])
def generate_document_content(
    request: schemas.GenerateContentRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    project = _get_project(db, request.project_id, current_user.id)
    ai_client = get_ai_service()

    sections = (
        db.query(models.Section)
        .filter(models.Section.project_id == project.id)
        .order_by(models.Section.order_index.asc())
        .all()
    )

    if not sections:
        titles = project.outline if project.document_type == "docx" else project.slides
        section_type = "section" if project.document_type == "docx" else "slide"
        for idx, title in enumerate(titles or []):
            section = models.Section(
                project_id=project.id,
                section_type=section_type,
                title=title,
                order_index=idx,
            )
            db.add(section)
        db.commit()
        sections = (
            db.query(models.Section)
            .filter(models.Section.project_id == project.id)
            .order_by(models.Section.order_index.asc())
            .all()
        )

    for section in sections:
        if section.content:
            continue
        section.content = ai_client.generate_section_content(
            document_type=project.document_type,
            main_topic=project.main_topic,
            section_title=section.title,
        )
        db.add(section)
    db.commit()
    return sections


@router.get("/{project_id}/export")
def export_document(
    project_id: int,
    format: str | None = Query(None, pattern="^(docx|pptx)$"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
) -> StreamingResponse:
    project = _get_project(db, project_id, current_user.id)
    export_format = format or project.document_type
    sections = (
        db.query(models.Section)
        .filter(models.Section.project_id == project.id)
        .order_by(models.Section.order_index.asc())
        .all()
    )

    if export_format == "docx":
        return document_builder.export_docx(project, sections)
    return document_builder.export_pptx(project, sections)

