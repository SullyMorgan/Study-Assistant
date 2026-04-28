from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StudySessionBase(BaseModel):
  class_id: int
  start_time: datetime
  end_time: Optional[datetime] = None
  duration: int

class StudySessionCreate(StudySessionBase):
  pass

class StudySessionOut(StudySessionBase):
  id: int
  user_id: int

  class Config:
    from_attributes = True