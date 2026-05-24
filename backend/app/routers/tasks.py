from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas
from dependencies import get_db, get_current_user

router = APIRouter(
  prefix="/tasks",
  tags=["Tasks"]
)

@router.post("/", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
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

@router.get("/", response_model=list[schemas.TaskOut], status_code=status.HTTP_200_OK)
def get_user_tasks(
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  tasks = db.query(models.Task).filter(
    models.Task.user_id == current_user.id
  ).all()

  if not tasks:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="No tasks found for the user."
    )

  return tasks

@router.put("/{task_id}/toggle", response_model=schemas.TaskOut, status_code=status.HTTP_200_OK)
def toggle_task_status(
  task_id: int,
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  task = db.query(models.Task).filter(
    models.Task.id == task_id,
    models.Task.user_id == current_user.id
  ).first()

  if not task:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Task not found."
    )
  
  task.is_completed = not task.is_completed
  db.commit()
  db.refresh(task)

  return task
