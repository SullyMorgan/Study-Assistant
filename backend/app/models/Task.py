from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

class TaskType(enum.Enum):
  assignment = "assignment"
  exam = "exam"
  project = "project"

class Task(Base):
  __tablename__ = "tasks"

  id = Column(Integer, primary_key=True)
  user_id = Column(Integer, ForeignKey("users.id"))
  class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"))

  title = Column(String, nullable=False)
  deadline = Column(DateTime, nullable=False)
  type = Column(SQLAlchemyEnum(TaskType), nullable=False)
  is_completed = Column(Boolean, default=False)

  owner = relationship("User")
  related_class = relationship("Class", back_populates="tasks")
