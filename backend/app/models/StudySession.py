from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class StudySession(Base):
  __tablename__ = "study_sessions"

  id = Column(Integer, primary_key=True)
  user_id = Column(Integer, ForeignKey("users.id")) # Foreign key to User.id
  class_id = Column(Integer, ForeignKey("classes.id")) # Foreign key to Class.id
  task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True) # Optional foreign key to Task.id

  start_time = Column(DateTime, default=datetime.datetime.utcnow)
  end_time = Column(DateTime)
  duration = Column(Integer) # Duration in minutes
  actual_duration = Column(Integer, nullable=True)

  status = Column(String, default="planned") # planned, completed, missed

  user = relationship("User", back_populates="sessions")
  study_class = relationship("Class", back_populates="sessions")
  task = relationship("Task")