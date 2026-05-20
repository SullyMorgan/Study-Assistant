from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session
from dependencies import get_db, get_current_user
from services import planner
from datetime import datetime, timedelta
import models
import schemas
from services import notification_service

router = APIRouter(prefix="/generate", tags=["Generator"])

@router.get("/test-slots", status_code=status.HTTP_200_OK)
def test_slots(
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  start = datetime.now()
  end = start + timedelta(days=1)

  slots = planner.get_free_slots(db, current_user.id, start, end)

  return {"free_slots": slots}

@router.get("/plan", response_model=schemas.PlanOut, status_code=status.HTTP_200_OK)
def get_study_plan(
  sleep_start: int = 23,
  sleep_end: int = 8,
  max_sessions_per_day: int = 3,
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  plan = planner.generate_plan(
    db,
    current_user.id,
    sleep_start=sleep_start,
    sleep_end=sleep_end,
    max_sessions_per_day=max_sessions_per_day
  )

  if not plan:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="No tasks or materials found to generate a study plan."
    )
  return schemas.PlanOut(suggested_plan=plan)

@router.post("/accept-plan", status_code=status.HTTP_200_OK)
def accept_study_plan(
   background_tasks: BackgroundTasks,
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  sessions = db.query(models.PlannedSession).filter(
    models.PlannedSession.user_id == current_user.id,
    models.PlannedSession.is_accepted == False
  ).all()

  if not sessions:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="No generated plan found to accept. Please generate a plan first."
    )
  
  has_push = current_user.push_subscription is not None

  for s in sessions:
    s.is_accepted = True

    if has_push:
       task = db.query(models.Task).filter(models.Task.id == s.task_id).first()
       task_title = task.title if task else "Study Session"

       background_tasks.add_task(
          notification_service.schedule_push,
          current_user.push_subscription,
          s.start_time,
          task_title
       )

  db.commit()
  return {"message": "Plan accepted and sessions saved to calendar!."}

@router.post("/generate-and-save", status_code=status.HTTP_201_CREATED)
def generate_and_save_plan(
  sleep_start: int = 23,
  sleep_end: int = 8,
  max_sessions_per_day: int = 3,
  db: Session = Depends(get_db), 
  current_user: models.User = Depends(get_current_user)
):
    recommendations = planner.generate_plan(
        db,
        current_user.id,
        sleep_start=sleep_start,
        sleep_end=sleep_end,
        max_sessions_per_day=max_sessions_per_day
    )
    
    if not recommendations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tasks or materials found to generate a study plan."
        )
    
    planner.save_planned_sessions(db, current_user.id, recommendations)
    
    return {
       "message": "Plan generated and saved as draft",
       "count": len(recommendations)
    }
