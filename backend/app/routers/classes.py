from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from dependencies import get_db, get_current_user

router = APIRouter(
  prefix="/classes",
  tags=["Classes"]
)

@router.post("/", response_model=schemas.ClassOut)
def create_class(
  class_data: schemas.ClassCreate,
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  new_class = models.Class(
    **class_data.model_dump(), # unpacking the fields
    user_id=current_user.id
  )
  db.add(new_class)
  db.commit()
  db.refresh(new_class)
  return new_class

@router.get("/", response_model=list[schemas.ClassOut])
def get_classes(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
  return db.query(models.Class).filter(models.Class.user_id == current_user.id).all()
