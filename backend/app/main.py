from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas, utils
from database import engine, Base, SessionLocal
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
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

app = FastAPI()

Base.metadata.create_all(bind=engine)

# print(Base.metadata.tables.keys())  # Debug: print all table names to verify they are created

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

# login endpoint
@app.post("/login", response_model=schemas.Token)
def login_user(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
  user = db.query(models.User).filter(models.User.email == user_credentials.email).first()

  if not user:
    raise HTTPException(status_code=403, detail="Invalid Credentials.")
  
  if not utils.verify_password(user_credentials.password, user.password_hash):
    raise HTTPException(status_code=403, detail="Invalid Credentials.")
  
  access_token = utils.create_access_token(data={"user_id": user.id})

  return {"access_token": access_token, "token_type": "bearer"}

# class creation endpoint
@app.post("/classes", response_model=schemas.ClassOut)
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

@app.get("/classes", response_model=list[schemas.ClassOut])
def get_classes(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
  return db.query(models.Class).filter(models.Class.user_id == current_user.id).all()

# study session creation endpoint
@app.post("/sessions", response_model=schemas.StudySessionOut)
def create_study_session(
  session_data: schemas.StudySessionCreate,
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  target_class = db.query(models.Class).filter(
    models.Class.id == session_data.class_id,
    models.Class.user_id == current_user.id
  ).first()

  if not target_class:
    raise HTTPException(status_code=404, detail="Class not found.")
  
  new_session = models.StudySession(
    **session_data.model_dump(),
    user_id=current_user.id
  )
  db.add(new_session)
  db.commit()
  db.refresh(new_session)

  return new_session

@app.get("/sessions", response_model=list[schemas.StudySessionOut])
def get_user_sessions(
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  return db.query(models.StudySession).filter(
    models.StudySession.user_id == current_user.id
  ).all()


# task endpoints
@app.post("/tasks", response_model=schemas.TaskOut)
def create_task(
  task_data: schemas.TaskCreate,
  db: Session = Depends(get_db),
  current_user: models.User = Depends(get_current_user)
):
  course = db.query(models.Class).filter(
    models.Class.id == task_data.class_id,
    models.Class.user_id == current_user.id
  ).first()

  if not course:
    raise HTTPException(status_code=404, detail="Class not found.")
  
  new_task = models.Task(
    **task_data.model_dump(),
    user_id=current_user.id
  )
  db.add(new_task)
  db.commit()
  db.refresh(new_task)

  return new_task