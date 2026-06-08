import os
import secrets
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta, timezone

# Password hashing configuration (Bcrypt automatically generates and uses a unique salt per user)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
# MUST NOT use hardcoded secrets in production. Fallback to random for testing only.
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    JWT_SECRET_KEY = secrets.token_hex(32)
    import logging
    logging.warning("Generating ephemeral JWT secret. Instance-isolated!")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
TEMP_TOKEN_EXPIRE_MINUTES = 3

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_temp_token(email: str) -> str:
    # Used strictly for 2FA intermediate step
    expire = datetime.now(timezone.utc) + timedelta(minutes=TEMP_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": email, "pre_2fa": True, "exp": expire}
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        # Require 'exp' claim to be valid, and force specific algorithm
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM], options={"require": ["exp"]})
        return payload
    except jwt.InvalidTokenError:
        return None

def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)
