from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from dependencies import get_db, get_current_user

router = APIRouter(
  prefix="/sessions",
  tags=["Study Sessions"]
)

@router.post("/", response_model=schemas.StudySessionOut)
def create_study_session(
  session_data: schemas.StudySessionCreate,
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  target_class = db.query(models.Class).filter(
    models.Class.id == session_data.class_id,
    models.Class.user_id == current_user.id
  ).first()

  if not target_class:
    raise HTTPException(status_code=404, detail="Class not found.")
  
  new_session = models.StudySession(
    **session_data.model_dump(),
    user_id=current_user.id
  )
  db.add(new_session)
  db.commit()
  db.refresh(new_session)

  return new_session

@router.get("/", response_model=list[schemas.StudySessionOut])
def get_user_sessions(
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  return db.query(models.StudySession).filter(
    models.StudySession.user_id == current_user.id
  ).all()