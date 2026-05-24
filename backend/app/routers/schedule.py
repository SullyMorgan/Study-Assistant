from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas
from dependencies import get_db, get_current_user

router = APIRouter(
  prefix="/schedule",
  tags=["Schedule"]
)

@router.get("/", response_model=list[schemas.ScheduleOut], status_code=status.HTTP_200_OK)
def get_schedules(
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  return db.query(models.UserSchedule).filter(models.UserSchedule.user_id == current_user.id).all()

@router.post("/", response_model=schemas.ScheduleOut, status_code=status.HTTP_201_CREATED)
def create_schedule(
  schedule_data: schemas.ScheduleCreate,
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  if schedule_data.end_time <= schedule_data.start_time:
    raise HTTPException(status_code=400, detail="End time must be after start time.")
  
  new_schedule = models.UserSchedule(
    **schedule_data.model_dump(),
    user_id=current_user.id
  )
  db.add(new_schedule)
  db.commit()
  db.refresh(new_schedule)

  return new_schedule
