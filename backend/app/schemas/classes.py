from pydantic import BaseModel

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