from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from database import Base

class UserSchedule(Base):
  __tablename__ = "user_schedule"

  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

  title = Column(String, nullable=False)
  start_time = Column(DateTime, nullable=False)
  end_time = Column(DateTime, nullable=False)

  is_recurring = Column(Boolean, default=False)
  