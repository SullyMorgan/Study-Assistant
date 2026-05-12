from sqlalchemy import Column, Integer, Boolean, ForeignKey, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from database import Base

class PlannedSession(Base):
  __tablename__ = "planned_sessions"

  id = Column(Integer, primary_key=True)
  user_id = Column(Integer, ForeignKey("users.id"))
  task_id = Column(Integer, ForeignKey("tasks.id"))

  start_time = Column(DateTime, nullable=False)
  end_time = Column(DateTime, nullable=False)
  is_accepted = Column(Boolean, default=False)

  task = relationship("Task")
  user = relationship("User")