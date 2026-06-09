from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas
from dependencies import get_db, get_current_user

router = APIRouter(
  prefix="/classes",
  tags=["Classes"]
)

@router.post("/", response_model=schemas.ClassOut, status_code=status.HTTP_201_CREATED)
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

@router.get("/", response_model=list[schemas.ClassOut], status_code=status.HTTP_200_OK)
def get_classes(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
  return db.query(models.Class).filter(models.Class.user_id == current_user.id).all()

@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(class_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
  target_class = db.query(models.Class).filter(
    models.Class.id == class_id,
    models.Class.user_id == current_user.id
  ).first()

  if not target_class:
    raise HTTPException(status_code=404, detail="Class not found.")

  db.delete(target_class)
  db.commit()

