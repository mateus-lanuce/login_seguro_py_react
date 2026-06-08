from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="Strong password with at least 8 characters")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Verify2FARequest(BaseModel):
    totp_code: str = Field(min_length=6, max_length=6)

class Verify2FAResponse(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    email: str
    totp_enabled: bool

    class Config:
        from_attributes = True
