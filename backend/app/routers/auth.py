from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas, utils
from database import SessionLocal
from dependencies import get_db

router = APIRouter(
  prefix="/auth",
  tags=["Authentication"]
)

@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
  existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
  if existing_user:
    raise HTTPException(status_code=400, detail="Email already in use.")
  
  hashed_password = utils.hash_password(user_data.password)

  new_user = models.User(
    name=user_data.name,
    email=user_data.email,
    password_hash=hashed_password
  )

  db.add(new_user)
  db.commit()
  db.refresh(new_user)  # to get generated ID

  return new_user

@router.post("/login", response_model=schemas.Token)
def login_user(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
  user = db.query(models.User).filter(models.User.email == user_credentials.email).first()

  if not user:
    raise HTTPException(status_code=403, detail="Invalid Credentials.")
  
  if not utils.verify_password(user_credentials.password, user.password_hash):
    raise HTTPException(status_code=403, detail="Invalid Credentials.")
  
  access_token = utils.create_access_token(data={"user_id": user.id})

  return {"access_token": access_token, "token_type": "bearer"}
