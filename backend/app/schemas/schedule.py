from pydantic import BaseModel
from datetime import datetime

class ScheduleBase(BaseModel):
  title: str
  start_time: datetime
  end_time: datetime
  is_recurring: bool = False

class ScheduleCreate(ScheduleBase):
  pass

class ScheduleOut(ScheduleBase):
  id: int
  user_id: int

  class Config:
    from_attributes = True
