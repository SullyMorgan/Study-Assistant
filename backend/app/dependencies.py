from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import models, utils, database


oath2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_db():
  db = database.SessionLocal()
  try:
    yield db
  finally:
    db.close()

def get_current_user(token: str = Depends(oath2_scheme), db: Session = Depends(get_db)):
  credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
  )
  try:
    payload = jwt.decode(token, utils.SECRET_KEY, algorithms=[utils.ALGORITHM])
    user_id: int = payload.get("user_id")
    if user_id is None:
      raise credentials_exception
  except JWTError:
    raise credentials_exception

  user = db.query(models.User).filter(models.User.id == user_id).first()
  if user is None:
    raise credentials_exception
  
  return user
