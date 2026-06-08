from sqlalchemy import Column, Integer, String, Boolean
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # The passlib library handles the salt within the hashed string for bcrypt/argon2
    
    totp_secret = Column(String, nullable=True)
    totp_enabled = Column(Boolean, default=False)
