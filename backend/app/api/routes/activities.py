from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.responses import FileResponse
from pathlib import Path
import shutil
import re
import uuid
import math
import csv
import io
import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import openpyxl
from openpyxl.utils.dataframe import dataframe_to_rows
import pandas as pd

from app.core.database import db, next_sequence
from app.models.schemas import *
from app.core.security import hash_password, verify_password, create_access_token
from app.api.dependencies import get_current_user, login_limiter, verify_token
from app.core.utils import parse_date_flexible, safe_str, check_customer_duplicate, check_vehicle_duplicate, create_activity

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== Activity/Notifications System ====================

class ActivityType(str, Enum):
    SALE_CREATED = "sale_created"
    SERVICE_COMPLETED = "service_completed"
    SERVICE_CREATED = "service_created"
    VEHICLE_ADDED = "vehicle_added"
    VEHICLE_SOLD = "vehicle_sold"
    LOW_STOCK = "low_stock"
    CUSTOMER_ADDED = "customer_added"
    BACKUP_CREATED = "backup_created"

class Activity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: ActivityType
    title: str
    description: str
    icon: str = "info"  # info, success, warning, error
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read: bool = False
    metadata: Optional[Dict[str, Any]] = None

class ActivityCreate(BaseModel):
    type: ActivityType
    title: str
    description: str
    icon: str = "info"
    metadata: Optional[Dict[str, Any]] = None

async def create_activity(activity_data: ActivityCreate):
    """Helper function to create an activity"""
    activity = Activity(**activity_data.dict())
    await db.activities.insert_one(activity.dict())
    return activity

@router.get("/api/activities")
async def get_activities(
    limit: int = 20,
    skip: int = 0,
    unread_only: bool = False,
    current_user: dict = Depends(verify_token)
):
    """Get recent activities/notifications"""
    query = {}
    if unread_only:
        query["read"] = False
    
    activities = await db.activities.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.activities.count_documents(query)
    unread_count = await db.activities.count_documents({"read": False})
    
    return {
        "activities": activities,
        "total": total,
        "unread_count": unread_count
    }

@router.post("/api/activities/{activity_id}/mark-read")
async def mark_activity_read(
    activity_id: str,
    current_user: dict = Depends(verify_token)
):
    """Mark an activity as read"""
    result = await db.activities.update_one(
        {"id": activity_id},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    return {"message": "Activity marked as read"}

@router.post("/api/activities/mark-all-read")
async def mark_all_activities_read(current_user: dict = Depends(verify_token)):
    """Mark all activities as read"""
    await db.activities.update_many(
        {"read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": "All activities marked as read"}

@router.delete("/api/activities/{activity_id}")
async def delete_activity(
    activity_id: str,
    current_user: dict = Depends(verify_token)
):
    """Delete an activity"""
    result = await db.activities.delete_one({"id": activity_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    return {"message": "Activity deleted"}

# ==================== End Activity/Notifications System ====================

app.include_router(api_router)

# CORS Configuration — restrict to internal network origins
# Add your deployment URLs here if needed
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5000,http://127.0.0.1:3000,http://127.0.0.1:5000').split(',')

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS],
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)
