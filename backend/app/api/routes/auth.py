from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File
import re
import uuid
import math
import csv
import io
import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import openpyxl
from openpyxl.utils.dataframe import dataframe_to_rows
import pandas as pd

from app.core.database import db, next_sequence
from app.models.schemas import *
from app.core.security import hash_password, verify_password, create_access_token
from app.api.dependencies import get_current_user, login_limiter
from app.core.utils import parse_date_flexible, safe_str, check_customer_duplicate, check_vehicle_duplicate, create_activity

router = APIRouter()
logger = logging.getLogger(__name__)


# Password validation helper
def validate_password_strength(password: str) -> str:
    """Validate password meets minimum complexity requirements."""
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if not re.search(r'[A-Z]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r'[a-z]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
    if not re.search(r'[0-9]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one digit")
    return password

# Authentication endpoints
@router.post("/auth/register")
async def register_user(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"$or": [{"username": user_data.username}, {"email": user_data.email}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    # Validate password strength
    validate_password_strength(user_data.password)
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user document for database
    user_dict = user_data.dict()
    user_dict.pop('password')
    user_dict['hashed_password'] = hashed_password
    user_dict['id'] = str(uuid.uuid4())
    user_dict['is_active'] = True
    user_dict['created_at'] = datetime.now(timezone.utc)
    
    await db.users.insert_one(user_dict)
    return {"message": "User registered successfully", "user_id": user_dict['id']}

@router.post("/auth/login")
async def login_user(user_credentials: UserLogin, request: Request):
    # Rate limiting by username (MongoDB-backed — survives restarts)
    rate_key = f"login:{user_credentials.username}"
    if await login_limiter.is_rate_limited(rate_key):
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts. Please try again in 5 minutes."
        )
    
    user = await db.users.find_one({"username": user_credentials.username})
    if not user or not verify_password(user_credentials.password, user['hashed_password']):
        await login_limiter.record_attempt(rate_key)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user['is_active']:
        raise HTTPException(status_code=401, detail="User account is inactive")
    
    # Reset rate limiter on successful login
    await login_limiter.reset(rate_key)
    
    access_token = create_access_token(data={"sub": user['username'], "role": user['role']})
    return {"access_token": access_token, "token_type": "bearer", "user": User(**user)}

@router.get("/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user
