from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from database import Base

class Class(Base):
  __tablename__ = "classes"

  id = Column(Integer, primary_key=True)
  user_id = Column(Integer, ForeignKey("users.id")) # Foreign key to User.id
  name = Column(String)
  difficulty = Column(String)

  owner = relationship("User", back_populates="classes")
  sessions = relationship("StudySession", back_populates="study_class", cascade="all, delete-orphan")
  tasks = relationship("Task", back_populates="related_class", cascade="all, delete-orphan")
