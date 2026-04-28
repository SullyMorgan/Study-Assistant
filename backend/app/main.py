from fastapi import FastAPI
from database import engine, Base
from routers import auth, classes, study_session, tasks, schedule

app = FastAPI(title="Study Assistant API")

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(classes.router)
app.include_router(study_session.router)
app.include_router(tasks.router)
app.include_router(schedule.router)

@app.get("/")
def root():
  return {"message": "Welcome to the Study Assistant API!"}
