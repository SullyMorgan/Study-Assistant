import os
import time
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from services.pdf_service import extract_text_from_pdf
from services import ai_service
from dependencies import get_current_user, get_db
import models
import schemas
from typing import List, Optional

router = APIRouter(prefix="/materials", tags=["Materials"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# uploads a material and extracts text if its a pdf
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

    if class_id:
        db_class = db.query(models.Class).filter(
            models.Class.id == class_id,
            models.Class.user_id == current_user.id
        ).first()
        if not db_class:
            raise HTTPException(status_code=404, detail="Class not found.")
    
    content = await file.read()
    with open(file_location, "wb") as buffer:
        buffer.write(content)

    extracted_text = ""
    if file_extension.lower() == "pdf":
        extracted_text = extract_text_from_pdf(file_location)

    new_material = models.Material(
        title=title,
        file_path=file_location,
        file_type=file_extension,
        content=extracted_text,
        user_id=current_user.id,
        class_id=class_id,
        task_id=task_id
    )

    db.add(new_material)
    db.commit()
    db.refresh(new_material)

    return new_material

@router.get("/test-read/{material_id}")
def test_pdf_read(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    material = db.query(models.Material).filter(
        models.Material.id == material_id,
        models.Material.user_id == current_user.id
    ).first()

    if not material:
        raise HTTPException(status_code=404, detail="Material not found.")
    
    if material.file_type.lower() != "pdf":
        raise HTTPException(status_code=400, detail="Only PDF files can be read.")
    
    text = extract_text_from_pdf(material.file_path)

    return {
        "filename": material.title,
        "char_count": len(text),
        "content_preview": text[:500]  # Return first 500 characters as a preview
    }

# lists all materials or filters by class
@router.get("/", response_model=List[schemas.MaterialOut])
def get_materials(
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Material).filter(models.Material.user_id == current_user.id)

    if class_id:
        query = query.filter(models.Material.class_id == class_id)

    return query.all()

# deletes material and file
@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    material = db.query(models.Material).filter(
        models.Material.id == material_id,
        models.Material.user_id == current_user.id
    ).first()

    if not material:
        raise HTTPException(status_code=404, detail="Material not found.")
    
    if os.path.exists(material.file_path):
        try:
            os.remove(material.file_path)
        except Exception as e:
            print(f"Error deleting file: {e}")

    db.delete(material)
    db.commit()

    return None

@router.get("/{material_id}/summary")
def get_material_summary(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    material = db.query(models.Material).filter(
        models.Material.id == material_id,
        models.Material.user_id == current_user.id
    ).first()

    if not material or not material.content:
        raise HTTPException(status_code=404, detail="Material not found or has no content to summarize.")
    
    summary = ai_service.generate_summary(material.content)

    return {"material_title": material.title, "summary": summary}

@router.get("/{material_id}/quiz")
def get_material_quiz(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    material = db.query(models.Material).filter(
        models.Material.id == material_id,
        models.Material.user_id == current_user.id
    ).first()

    if not material or not material.content:
        raise HTTPException(status_code=404, detail="Material not found or has no content to generate quiz from.")
    
    quiz = ai_service.generate_quiz(material.content)

    return {"material_title": material.title, "quiz": quiz}
