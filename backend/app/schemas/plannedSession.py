from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PlannedSessionRecommendation(BaseModel):
  task_id: int
  task_title: str
  class_name: str
  start: datetime
  end: datetime
  message: str

  class Config:
    from_attributes = True

class PlanOut(BaseModel):
  suggested_plan: List[PlannedSessionRecommendation]
