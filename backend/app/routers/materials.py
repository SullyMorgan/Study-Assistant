import os
from time import time
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
import models
import shutil
import schemas

router = APIRouter(prefix="/materials", tags=["Materials"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload", response_model=schemas.MaterialOut)
async def upload_material(
    title: str,
    class_id: int = None,
    task_id: int = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    file_extension = file.filename.split(".")[-1]
    safe_filename = f"{current_user.id}_{int(time.time())}_{file.filename}"
    file_location = os.path.join(UPLOAD_DIR, safe_filename)

    content = await file.read()
    with open(file_location, "wb") as buffer:
        buffer.write(content)

    new_material = models.Material(
        title=title,
        file_path=file_location,
        file_type=file_extension,
        user_id=current_user.id,
        class_id=class_id,
        task_id=task_id
    )

    db.add(new_material)
    db.commit()
    db.refresh(new_material)

    return new_material

