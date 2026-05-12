from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MaterialBase(BaseModel):
  title: str
  class_id: Optional[int] = None
  task_id: Optional[int] = None

class MaterialCreate(MaterialBase):
  pass

class MaterialOut(MaterialBase):
  id: int
  file_path: str
  file_type: str
  user_id: int

  class Config:
    from_attributes = True
