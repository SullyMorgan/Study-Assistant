from pydantic import BaseModel, EmailStr

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
