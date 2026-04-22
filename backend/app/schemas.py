from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import enum

# user & auth
class UserCreate(BaseModel):
  name: str
  email: EmailStr
  password: str

class UserOut(BaseModel):
  id: int
  name: str
  email: EmailStr

  class Config:
    from_attributes = True

class Token(BaseModel):
  access_token: str
  token_type: str

class UserLogin(BaseModel):
  email: EmailStr
  password: str

# classes
class ClassBase(BaseModel):
  name: str
  difficulty: str

class ClassCreate(ClassBase):
  pass

class ClassOut(ClassBase):
  id: int
  user_id: int

  class Config:
    from_attributes = True

# study sessions
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

# tasks
class TaskType(str, enum.Enum):
  assignment = "assignment"
  exam = "exam"
  project = "project"

class TaskBase(BaseModel):
  title: str
  deadline: datetime
  type: TaskType
  class_id: int

class TaskCreate(TaskBase):
  pass

class TaskOut(TaskBase):
  id: int
  user_id: int
  is_completed: bool

  class Config:
    from_attributes = True