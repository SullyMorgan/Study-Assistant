from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str):
  return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
  return pwd_context.verify(plain_password, hashed_password)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

def create_access_token(data: dict):
  to_encode = data.copy()
  expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  to_encode.update({"exp": expire})
  encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
  return encoded_jwt
