from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas, auth as auth_utils
from app.database import get_db
from app.services.ai_service import get_ai_service

router = APIRouter()


def _get_section(db: Session, section_id: int, user_id: int) -> models.Section:
    section = (
        db.query(models.Section)
        .join(models.Project)
        .filter(
            models.Section.id == section_id,
            models.Project.user_id == user_id,
            models.Project.id == models.Section.project_id,
        )
        .first()
    )
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section


@router.post("/", response_model=schemas.RefinementResponse)
def refine_section(
    request: schemas.RefinementRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    section = _get_section(db, request.section_id, current_user.id)
    project = section.project
    if not section.content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Section has no content to refine yet.",
        )

    ai_client = get_ai_service()
    refined_text = ai_client.refine_content(
        document_type=project.document_type,
        main_topic=project.main_topic,
        section_title=section.title,
        current_content=section.content,
        prompt=request.prompt,
    )

    refinement = models.Refinement(
        project_id=project.id,
        section_id=section.id,
        prompt=request.prompt,
        original_content=section.content,
        refined_content=refined_text,
    )
    section.content = refined_text

    db.add(refinement)
    db.add(section)
    db.commit()
    db.refresh(refinement)
    return refinement


@router.post("/feedback", response_model=schemas.RefinementResponse)
def submit_feedback(
    feedback_payload: schemas.RefinementFeedback,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    refinement = (
        db.query(models.Refinement)
        .join(models.Project)
        .filter(
            models.Refinement.id == feedback_payload.refinement_id,
            models.Project.user_id == current_user.id,
        )
        .first()
    )
    if not refinement:
        raise HTTPException(status_code=404, detail="Refinement not found")

    refinement.user_feedback = feedback_payload.feedback
    refinement.user_comment = feedback_payload.comment
    db.commit()
    db.refresh(refinement)
    return refinement


@router.get("/{project_id}", response_model=List[schemas.RefinementResponse])
def list_refinements(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    refinements = (
        db.query(models.Refinement)
        .join(models.Project)
        .filter(
            models.Refinement.project_id == project_id,
            models.Project.user_id == current_user.id,
        )
        .order_by(models.Refinement.created_at.desc())
        .all()
    )
    return refinements

