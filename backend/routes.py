import os
import pyotp
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, Any
import redis.asyncio as redis
from datetime import datetime, timezone

from database import get_db
from models import User
from schemas import UserCreate, UserLogin, Verify2FARequest, UserResponse
from security import (
    get_password_hash, verify_password, create_access_token,
    verify_token, generate_csrf_token, verify_csrf, redis_client
)

logger = logging.getLogger(__name__)

router = APIRouter()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Authentication Dependency
async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get("access_token")
    if not token:
        logger.warning("Tentativa de acesso sem token")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    # Check if token is blacklisted in redis
    is_blacklisted = await redis_client.get(f"blacklist:{token}")
    if is_blacklisted:
        logger.warning("Tentativa de acesso com token revogado")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked")

    payload = verify_token(token)
    if not payload or payload.get("pre_2fa"):
        logger.warning("Token inválido ou com pre_2fa")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
    return user

@router.get("/csrf-token")
async def get_csrf_token(response: Response):
    csrf_token = generate_csrf_token()
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        secure=True, 
        samesite="lax"
    )
    logger.info("Novo CSRF token gerado")
    return {"message": "CSRF token set"}

@router.post("/register", dependencies=[Depends(verify_csrf)])
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pw = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    await db.commit()
    return {"message": "User registered successfully"}

@router.post("/login", dependencies=[Depends(verify_csrf)])
async def login(response: Response, user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    logger.info(f"Tentativa de login: {user_data.email}")
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalars().first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        logger.warning(f"Login falhou: credenciais inválidas para {user_data.email}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
    if user.totp_enabled:
        logger.info(f"Usuário requer 2FA: {user_data.email}")
        temp_token = create_access_token({"sub": user.email, "pre_2fa": True})
        return {"requires_2fa": True, "temp_token": temp_token}
        
    access_token = create_access_token({"sub": user.email})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax"
    )
    logger.info(f"Login com sucesso: {user_data.email}")
    return {"message": "Logged in successfully", "requires_2fa": False}

@router.post("/verify-2fa", dependencies=[Depends(verify_csrf)])
async def verify_2fa(request: Request, response: Response, data: Verify2FARequest, db: AsyncSession = Depends(get_db)):
    temp_token = request.headers.get("x-temp-token")
    if not temp_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Temporary token missing")
        
    payload = verify_token(temp_token)
    if not payload or not payload.get("pre_2fa"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid temporary token")
        
    email = payload.get("sub")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if not user or not user.totp_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA not enabled for user")
        
    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(data.totp_code):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid 2FA code")
        
    access_token = create_access_token({"sub": user.email})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax"
    )
    return {"message": "Logged in successfully"}

@router.post("/enable-2fa", dependencies=[Depends(verify_csrf)])
async def enable_2fa(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.totp_enabled:
        logger.warning(f"Usuário ID {current_user.id} já tem 2FA habilitado")
        raise HTTPException(status_code=400, detail="2FA already enabled")
        
    secret = pyotp.random_base32()
    current_user.totp_secret = secret
    await db.commit()
    logger.info(f"Setup de 2FA iniciado para usuário ID {current_user.id}")
    
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=current_user.email, issuer_name="SecureLoginApp")
    return {"secret": secret, "qr_uri": uri}

@router.post("/confirm-2fa", dependencies=[Depends(verify_csrf)])
async def confirm_2fa(data: Verify2FARequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA not initiated")
        
    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(data.totp_code):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid 2FA code")
        
    current_user.totp_enabled = True
    await db.commit()
    return {"message": "2FA successfully enabled"}

@router.post("/logout", dependencies=[Depends(verify_csrf)])
async def logout(request: Request, response: Response):
    token = request.cookies.get("access_token")
    if token:
        # Blacklist the token in Redis
        payload = verify_token(token)
        if payload and "exp" in payload:
            exp_timestamp = payload["exp"]
            now_timestamp = int(datetime.now(timezone.utc).timestamp())
            ttl = exp_timestamp - now_timestamp
            if ttl > 0:
                await redis_client.setex(f"bl_{token}", ttl, "true")
                
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
