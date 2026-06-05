import json
import requests
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
import models, schemas
from dependencies import get_db, get_current_user
from typing import Optional

router = APIRouter(
    prefix="/sessions",
    tags=["Study Sessions"]
)

EXPO_PUSH_URL = "https://exp.host(--)/--/api/v2/push/send"

def send_expo_push_notification(expo_token: str, title: str, body: str):
    if not expo_token or not expo_token.startswith("ExponentPushToken"):
        return
    
    payload = {
        "to": expo_token,
        "sound": "default",
        "title": title,
        "body": body,
        "badge": 1,
        "data": {"type": "study_session"}
    }
    
    try:
        response = requests.post(
            EXPO_PUSH_URL,
            headers={"Content-Type": "application/json", "accept": "application/json"},
            json=payload,
            timeout=10
        )
        res_data = response.json()
        print(f"Expo Push Response: {res_data}")
    except Exception as ex:
        print(f"Expo push failed: {repr(ex)}")

import time
def schedule_push_background(expo_token: str, start_time: datetime, task_title: str):
    trigger_time = start_time - timedelta(minutes=10)
    seconds_to_wait = (trigger_time - datetime.now()).total_seconds()

    if seconds_to_wait > 0:
        time.sleep(seconds_to_wait)

    send_expo_push_notification(
        expo_token=expo_token,
        title="📖 Mindjárt kezdődik a tanulás!",
        body=f"10 perc múlva kezdődik a(z) '{task_title}' alkalmad. Készülj fel!"
    )

@router.post("/", response_model=schemas.StudySessionOut, status_code=status.HTTP_201_CREATED)
def create_study_session(
    session_data: schemas.StudySessionCreate,
    background_tasks: BackgroundTasks,
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

    if hasattr(current_user, 'push_subscription') and current_user.push_subscription:
        task_title = target_class.name
        background_tasks.add_task(
            schedule_push_background,
            expo_token=current_user.push_subscription,
            start_time=new_session.start_time,
            task_title=task_title
        )

    return new_session

@router.post("/register-push", status_code=status.HTTP_200_OK)
def register_push(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    token = payload.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token is required.")
        
    current_user.push_subscription = token
    db.commit()

    return {"message": "Expo push token registered successfully."}
