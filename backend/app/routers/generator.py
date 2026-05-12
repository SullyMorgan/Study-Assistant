from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from dependencies import get_db, get_current_user
from services import planner
from datetime import datetime, timedelta
import models
import schemas

router = APIRouter(prefix="/generate", tags=["Generator"])

@router.get("/test-slots")
def test_slots(
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  start = datetime.now()
  end = start + timedelta(days=1)

  slots = planner.get_free_slots(db, current_user.id, start, end)
  return {"free_slots": slots}

@router.get("/plan", response_model=schemas.PlanOut)
def get_study_plan(
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  plan = planner.generate_plan(db, current_user.id)
  return schemas.PlanOut(suggested_plan=plan)

@router.post("/accept-plan")
def accept_study_plan(
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  sessions = db.query(models.PlannedSession).filter(
    models.PlannedSession.user_id == current_user.id,
    models.PlannedSession.is_accepted == False
  ).all()

  for s in sessions:
    s.is_accepted = True

  db.commit()
  return {"message": "Plan accepted and sessions saved to calendar!."}

@router.post("/generate-and-save")
def generate_and_save_plan(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    recommendations = planner.generate_plan(db, current_user.id)
    
    planner.save_planned_sessions(db, current_user.id, recommendations)
    
    return {"message": "Plan generated and saved as draft", "count": len(recommendations)}
