from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from dependencies import get_db, get_current_user

router = APIRouter(
  prefix="/tasks",
  tags=["Tasks"]
)

@router.post("/", response_model=schemas.TaskOut)
def create_task(
  task_data: schemas.TaskCreate,
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  course = db.query(models.Class).filter(
    models.Class.id == task_data.class_id,
    models.Class.user_id == current_user.id
  ).first()

  if not course:
    raise HTTPException(status_code=404, detail="Class not found.")
  
  new_task = models.Task(
    **task_data.model_dump(),
    user_id=current_user.id
  )
  db.add(new_task)
  db.commit()
  db.refresh(new_task)

  return new_task
