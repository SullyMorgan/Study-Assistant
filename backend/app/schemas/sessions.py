from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class StudySessionBase(BaseModel):
  class_id: int
  task_id: Optional[int] = None
  start_time: datetime
  end_time: Optional[datetime] = None
  duration: int
  actual_duration: Optional[int] = None
  status: str = "planned" # planned, completed, missed

class StudySessionCreate(StudySessionBase):
  pass

class StudySessionOut(StudySessionBase):
  id: int
  user_id: int
  task_title: Optional[str] = None
  class_name: Optional[str] = None

  class Config:
    from_attributes = True

class StudySessionAcceptItem(BaseModel):
  class_id: int
  task_id: Optional[int] = None
  start_time: datetime
  end_time: Optional[datetime] = None
  duration: int
  status: str = "planned"

class PlanAcceptIn(BaseModel):
  suggested_plan: List[StudySessionAcceptItem]

class PlanOut(BaseModel):
  suggested_plan: List[StudySessionOut]