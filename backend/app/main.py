from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas, utils
from database import engine, Base, SessionLocal

app = FastAPI()

Base.metadata.create_all(bind=engine)

print(Base.metadata.tables.keys())  # Debug: print all table names to verify they are created

def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()

# registration endpoint
@app.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
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
