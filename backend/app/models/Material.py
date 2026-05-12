from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from database import Base

class Material(Base):
  __tablename__ = "materials"

  id = Column(Integer, primary_key=True)
  title = Column(String, nullable=False)
  file_path = Column(String, nullable=False)
  file_type = Column(String)

  user_id = Column(Integer, ForeignKey("users.id"))
  class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
  task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)

  owner = relationship("User")
  related_class = relationship("Class")
  related_task = relationship("Task")