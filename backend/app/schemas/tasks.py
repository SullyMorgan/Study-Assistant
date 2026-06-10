from pydantic import BaseModel
from datetime import datetime
import enum

class TaskType(str, enum.Enum):
  assignment = "assignment"
  exam = "exam"
  project = "project"

class TaskBase(BaseModel):
  title: str
  deadline: datetime
  type: TaskType
  class_id: int | None = None

class TaskCreate(TaskBase):
  pass

class TaskOut(TaskBase):
  id: int
  user_id: int
  is_completed: bool

  class Config:
    from_attributes = True