from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
import models, schemas
from dependencies import get_db, get_current_user
import json

router = APIRouter(
  prefix="/sessions",
  tags=["Study Sessions"]
)

# helper function simulating notification sending
def send_notification_delay(user_id: int, message: str):
  print("Simulating notification to user_id {}: {}".format(user_id, message))

@router.post("/", response_model=schemas.StudySessionOut, status_code=status.HTTP_201_CREATED)
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

@router.get("/", response_model=list[schemas.StudySessionOut], status_code=status.HTTP_200_OK)
def get_user_sessions(
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  sessions = db.query(models.StudySession).filter(
    models.StudySession.user_id == current_user.id
  ).all()
  
  return sessions

@router.post("/{session_id}/complete", status_code=status.HTTP_200_OK)
def complete_study_session(
  session_id: int,
  actual_duration_minutes: int,
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  session = db.query(models.PlannedSession).filter(
    models.PlannedSession.id == session_id,
    models.PlannedSession.user_id == current_user.id
  ).first()

  if not session:
    raise HTTPException(
      status_code=404,
      detail="Planned study session not found."
    )
  
  session.actual_duration_minutes = actual_duration_minutes

  task = db.query(models.Task).filter(models.Task.id == session.task_id).first()
  if task:
    task.is_completed = True

  db.commit()
  return {"message": "Study session marked as completed."}

@router.post("/register-push", status_code=status.HTTP_200_OK)
def register_push(
  subscription_data: dict,
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  current_user.push_subscription = json.dumps(subscription_data)
  db.commit()

  return {"message": "Push subscription registered successfully."}
