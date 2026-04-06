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


# Dismissed Service Due Model - track service due records that have been dismissed/deleted
class DismissedServiceDue(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    service_due_key: str  # Unique key: customer_id-vehicle_number
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    vehicle_reg_no: Optional[str] = None
    dismissed_by: str
    dismissed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reason: Optional[str] = None

# Service Due Base Date Override Model - store custom base dates
class ServiceDueBaseDateOverride(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    service_due_key: str  # Unique key: customer_id-vehicle_number
    custom_base_date: datetime
    updated_by: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notes: Optional[str] = None

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"username": username})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return user data"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"username": username})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Handle both 'id' and '_id' fields for user identification
        user_id = user.get("id") or str(user.get("_id", ""))
        return {"user_id": user_id, "username": user["username"], "role": user.get("role", "user")}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def parse_date_flexible(date_str: str) -> datetime:
    """Parse date from various formats"""
    date_str = date_str.strip()
    
    # Try to parse as Excel serial date number
    try:
        excel_date = float(date_str)
        if excel_date > 59:
            excel_date -= 1
        return datetime(1900, 1, 1, tzinfo=timezone.utc) + timedelta(days=excel_date - 2)
    except (ValueError, TypeError):
        pass
    
    # Try various string date formats
    # Format: DD-MMM (03-Mar) - add current year
    if re.match(r'\d{1,2}-[A-Za-z]{3}', date_str):
        date_str = f"{date_str}-{datetime.now().year}"
        return datetime.strptime(date_str, "%d-%b-%Y").replace(tzinfo=timezone.utc)
    # Format: DD/MM/YYYY (15/01/2024)
    elif re.match(r'\d{1,2}/\d{1,2}/\d{4}', date_str):
        return datetime.strptime(date_str, "%d/%m/%Y").replace(tzinfo=timezone.utc)
    # Format: DD-MM-YYYY (15-01-2024)
    elif re.match(r'\d{1,2}-\d{1,2}-\d{4}', date_str):
        return datetime.strptime(date_str, "%d-%m-%Y").replace(tzinfo=timezone.utc)
    # Format: YYYY-MM-DD (2024-01-15) - ISO format
    elif re.match(r'\d{4}-\d{1,2}-\d{1,2}', date_str):
        return datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    # Format: YYYY/MM/DD (2024/01/15)
    elif re.match(r'\d{4}/\d{1,2}/\d{1,2}', date_str):
        return datetime.strptime(date_str, "%Y/%m/%d").replace(tzinfo=timezone.utc)
    # Format: DD MMM YYYY (15 Jan 2024)
    elif re.match(r'\d{1,2}\s+[A-Za-z]{3}\s+\d{4}', date_str):
        return datetime.strptime(date_str, "%d %b %Y").replace(tzinfo=timezone.utc)
    # Format: MMM DD, YYYY (Jan 15, 2024)
    elif re.match(r'[A-Za-z]{3}\s+\d{1,2},?\s+\d{4}', date_str):
        return datetime.strptime(date_str.replace(',', ''), "%b %d %Y").replace(tzinfo=timezone.utc)
    else:
        # Try generic parser as last resort
        try:
            from dateutil import parser
            return parser.parse(date_str).replace(tzinfo=timezone.utc)
        except:
            return datetime.now(timezone.utc)

def safe_str(value) -> str:
    """Safely convert a value to string, handling NaN, None, and floats from Excel/pandas"""
    import math
    if value is None:
        return ''
    if isinstance(value, float):
        # Check for NaN
        if math.isnan(value):
            return ''
        # If it's a whole number, convert without decimal
        if value == int(value):
            return str(int(value))
        return str(value)
    if isinstance(value, (int, bool)):
        return str(value)
    if isinstance(value, str):
        return value.strip()
    return str(value).strip() if value else ''

# Health check endpoints for Kubernetes (both root and /api paths for compatibility)
@router.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes liveness probe"""
    return {"status": "healthy"}

@router.get("/ready")
async def readiness_check():
    """Readiness check endpoint for Kubernetes readiness probe"""
    try:
        # Test database connection
        await db.command("ping")
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database not ready: {str(e)}")

# Also add health checks under /api prefix for compatibility
@router.get("/health")
async def api_health_check():
    """Health check endpoint at /api/health"""
    return {"status": "healthy"}

@router.get("/ready")
async def api_readiness_check():
    """Readiness check endpoint at /api/ready"""
    try:
        # Test database connection
        await db.command("ping")
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database not ready: {str(e)}")

# Test endpoint
@router.get("/")
async def root():
    return {"message": "Two Wheeler Business Management API is running"}

# Dismissed Service Due endpoints
@router.get("/dismissed-service-due")
async def get_dismissed_service_due(current_user: User = Depends(get_current_user)):
    """Get all dismissed service due records"""
    dismissed = await db.dismissed_service_due.find({}, {"_id": 0}).to_list(10000)
    return dismissed

@router.post("/dismissed-service-due")
async def dismiss_service_due(data: dict, current_user: User = Depends(get_current_user)):
    """Dismiss a single service due record"""
    dismissed = DismissedServiceDue(
        service_due_key=data.get("service_due_key"),
        customer_id=data.get("customer_id"),
        customer_name=data.get("customer_name"),
        vehicle_reg_no=data.get("vehicle_reg_no"),
        dismissed_by=current_user.id,
        reason=data.get("reason", "Manually dismissed")
    )
    await db.dismissed_service_due.insert_one(dismissed.dict())
    return {"message": "Service due record dismissed successfully", "id": dismissed.id}

@router.post("/dismissed-service-due/bulk")
async def bulk_dismiss_service_due(data: dict, current_user: User = Depends(get_current_user)):
    """Bulk dismiss service due records"""
    items = data.get("items", [])
    if not items:
        raise HTTPException(status_code=400, detail="No items provided for bulk dismiss")
    
    dismissed_count = 0
    for item in items:
        dismissed = DismissedServiceDue(
            service_due_key=item.get("service_due_key"),
            customer_id=item.get("customer_id"),
            customer_name=item.get("customer_name"),
            vehicle_reg_no=item.get("vehicle_reg_no"),
            dismissed_by=current_user.id,
            reason=item.get("reason", "Bulk dismissed")
        )
        await db.dismissed_service_due.insert_one(dismissed.dict())
        dismissed_count += 1
    
    return {"message": f"Successfully dismissed {dismissed_count} service due records", "count": dismissed_count}

@router.delete("/dismissed-service-due/{key}")
async def restore_service_due(key: str, current_user: User = Depends(get_current_user)):
    """Restore a dismissed service due record (remove from dismissed list)"""
    result = await db.dismissed_service_due.delete_one({"service_due_key": key})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dismissed record not found")
    return {"message": "Service due record restored successfully"}

# Service Due Base Date Override endpoints
@router.get("/service-due-base-date")
async def get_base_date_overrides(current_user: User = Depends(get_current_user)):
    """Get all base date overrides"""
    overrides = await db.service_due_base_date_overrides.find({}, {"_id": 0}).to_list(10000)
    return overrides

@router.post("/service-due-base-date")
async def set_base_date_override(data: dict, current_user: User = Depends(get_current_user)):
    """Set or update a base date override for a service due record"""
    service_due_key = data.get("service_due_key")
    custom_base_date = data.get("custom_base_date")
    
    if not service_due_key or not custom_base_date:
        raise HTTPException(status_code=400, detail="service_due_key and custom_base_date are required")
    
    # Parse the date
    try:
        if isinstance(custom_base_date, str):
            parsed_date = datetime.fromisoformat(custom_base_date.replace('Z', '+00:00'))
        else:
            parsed_date = custom_base_date
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    
    # Check if override already exists
    existing = await db.service_due_base_date_overrides.find_one({"service_due_key": service_due_key})
    
    if existing:
        # Update existing override
        await db.service_due_base_date_overrides.update_one(
            {"service_due_key": service_due_key},
            {"$set": {
                "custom_base_date": parsed_date,
                "updated_by": current_user.id,
                "updated_at": datetime.now(timezone.utc),
                "notes": data.get("notes")
            }}
        )
        return {"message": "Base date override updated successfully", "service_due_key": service_due_key}
    else:
        # Create new override
        override = ServiceDueBaseDateOverride(
            service_due_key=service_due_key,
            custom_base_date=parsed_date,
            updated_by=current_user.id,
            notes=data.get("notes")
        )
        await db.service_due_base_date_overrides.insert_one(override.dict())
        return {"message": "Base date override created successfully", "id": override.id}

@router.delete("/service-due-base-date/{key}")
async def delete_base_date_override(key: str, current_user: User = Depends(get_current_user)):
    """Delete a base date override (revert to calculated date)"""
    result = await db.service_due_base_date_overrides.delete_one({"service_due_key": key})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Base date override not found")
    return {"message": "Base date override removed successfully"}

# Registration endpoints (One-time customer + vehicle registration)
@router.post("/registrations", response_model=Registration)
async def create_registration(reg_data: RegistrationCreate, current_user: User = Depends(get_current_user)):
    # Check if customer already exists by mobile
    existing_customer = await db.customers.find_one({"mobile": reg_data.customer_mobile})
    
    if existing_customer:
        customer_id = existing_customer["id"]
        # Update customer name if different
        if existing_customer.get("name") != reg_data.customer_name:
            await db.customers.update_one(
                {"id": customer_id},
                {"$set": {"name": reg_data.customer_name}}
            )
    else:
        # Create new customer
        customer_id = str(uuid.uuid4())
        customer = {
            "id": customer_id,
            "name": reg_data.customer_name,
            "mobile": reg_data.customer_mobile,
            "address": reg_data.customer_address or "",
            "created_at": datetime.now(timezone.utc)
        }
        await db.customers.insert_one(customer)
    
    # Generate registration number
    seq = await next_sequence("registrations")
    registration_number = f"REG-{seq:06d}"
    
    registration = Registration(
        registration_number=registration_number,
        customer_id=customer_id,
        customer_name=reg_data.customer_name,
        customer_mobile=reg_data.customer_mobile,
        customer_address=reg_data.customer_address,
        vehicle_number=reg_data.vehicle_number,
        vehicle_brand=reg_data.vehicle_brand,
        vehicle_model=reg_data.vehicle_model,
        vehicle_year=reg_data.vehicle_year,
        chassis_number=reg_data.chassis_number,
        engine_number=reg_data.engine_number,
        created_by=current_user.id
    )
    
    await db.registrations.insert_one(registration.dict())
    return registration

@router.get("/registrations")
async def get_registrations(current_user: User = Depends(get_current_user)):
    registrations = await db.registrations.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return registrations

@router.get("/registrations/{reg_id}")
async def get_registration(reg_id: str, current_user: User = Depends(get_current_user)):
    registration = await db.registrations.find_one({"id": reg_id}, {"_id": 0})
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    return registration

@router.put("/registrations/{reg_id}")
async def update_registration(reg_id: str, reg_data: RegistrationCreate, current_user: User = Depends(get_current_user)):
    existing = await db.registrations.find_one({"id": reg_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    update_data = reg_data.dict()
    update_data["id"] = reg_id
    update_data["registration_number"] = existing["registration_number"]
    update_data["customer_id"] = existing["customer_id"]
    update_data["created_by"] = existing["created_by"]
    update_data["created_at"] = existing["created_at"]
    update_data["registration_date"] = existing.get("registration_date", datetime.now(timezone.utc))
    
    await db.registrations.replace_one({"id": reg_id}, update_data)
    return update_data

@router.delete("/registrations/{reg_id}")
async def delete_registration(reg_id: str, current_user: User = Depends(get_current_user)):
    existing = await db.registrations.find_one({"id": reg_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    await db.registrations.delete_one({"id": reg_id})
    return {"message": "Registration deleted successfully"}

# Service endpoints
@router.post("/services", response_model=Service)
async def create_service(service_data: ServiceCreate, current_user: User = Depends(get_current_user)):
    # Generate job card number (atomic)
    seq = await next_sequence("services")
    job_card_number = f"JOB-{seq:06d}"
    
    service_dict = service_data.dict()
    service_dict['job_card_number'] = job_card_number
    service_dict['created_by'] = current_user.id
    
    # If service_date is provided, use it; otherwise default will be applied by Service model
    if service_dict.get('service_date') is None:
        service_dict['service_date'] = datetime.now(timezone.utc)
    
    service = Service(**service_dict)
    
    await db.services.insert_one(service.dict())
    return service

@router.get("/services")
async def get_services(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 100,
    sort: str = "created_at",
    order: str = "desc",
    current_user: User = Depends(get_current_user)
):
    """Get services with pagination and search. Designed for 4000+ records."""
    filter_dict = {}
    if status:
        filter_dict["status"] = status
    
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        filter_dict["$or"] = [
            {"job_card_number": search_regex},
            {"vehicle_number": search_regex},
            {"service_type": search_regex},
            {"description": search_regex},
            {"vehicle_brand": search_regex},
            {"vehicle_model": search_regex},
        ]
    
    valid_sort_fields = ["created_at", "service_date", "amount", "job_card_number", "status"]
    if sort not in valid_sort_fields:
        sort = "created_at"
    sort_direction = 1 if order == "asc" else -1
    
    skip = (page - 1) * limit
    total = await db.services.count_documents(filter_dict)
    
    services = await db.services.find(filter_dict).sort(sort, sort_direction).skip(skip).limit(limit).to_list(limit)
    
    return {
        "data": [Service(**s).dict() for s in services],
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
    }

@router.get("/services/{service_id}", response_model=Service)
async def get_service(service_id: str, current_user: User = Depends(get_current_user)):
    service = await db.services.find_one({"id": service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return Service(**service)

@router.put("/services/{service_id}", response_model=Service)
async def update_service(service_id: str, service_data: ServiceUpdate, current_user: User = Depends(get_current_user)):
    # Check if service exists
    existing_service = await db.services.find_one({"id": service_id})
    if not existing_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Update service data
    update_data = service_data.dict()
    update_data["id"] = service_id  # Keep the original ID
    update_data["job_card_number"] = existing_service["job_card_number"]  # Keep original job card number
    update_data["created_by"] = existing_service["created_by"]  # Keep original creator
    update_data["created_at"] = existing_service["created_at"]  # Keep original creation date
    update_data["status"] = existing_service.get("status", ServiceStatus.PENDING)  # Keep current status
    update_data["completion_date"] = existing_service.get("completion_date")  # Keep completion date if exists
    
    # If service_date not provided, keep the existing one
    if update_data.get("service_date") is None:
        update_data["service_date"] = existing_service.get("service_date")
    
    updated_service = Service(**update_data)
    await db.services.replace_one({"id": service_id}, updated_service.dict())
    return updated_service

@router.put("/services/{service_id}/status")
async def update_service_status(service_id: str, status_data: dict, current_user: User = Depends(get_current_user)):
    status = status_data.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    update_data = {"status": status}
    if status == ServiceStatus.COMPLETED:
        update_data["completion_date"] = datetime.now(timezone.utc)
    
    await db.services.update_one({"id": service_id}, {"$set": update_data})
    
    # Create activity notification for completed services
    if status == ServiceStatus.COMPLETED:
        try:
            service = await db.services.find_one({"id": service_id}, {"_id": 0})
            if service:
                vehicle_info = service.get('vehicle_number', 'N/A')
                service_type = service.get('service_type', 'Service')
                
                await create_activity(ActivityCreate(
                    type=ActivityType.SERVICE_COMPLETED,
                    title="Service completed",
                    description=f"{service_type} for {vehicle_info}",
                    icon="success",
                    metadata={"service_id": service_id}
                ))
        except Exception as e:
            logger.warning(f"Failed to create activity for service completion: {e}")
    
    return {"message": "Service status updated successfully"}

@router.get("/services/job-card/{job_card_number}")
async def get_service_by_job_card(job_card_number: str, current_user: User = Depends(get_current_user)):
    """Get service details by job card number for billing"""
    service = await db.services.find_one({"job_card_number": job_card_number.upper()})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found with this job card number")
    
    # Get customer details
    customer = await db.customers.find_one({"id": service["customer_id"]})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found for this service")
    
    # Prepare service details for billing
    service_details = {
        "service_id": service["id"],
        "job_card_number": service["job_card_number"],
        "customer_id": service["customer_id"],
        "customer_name": customer["name"],
        "customer_phone": customer["mobile"],
        "customer_address": customer["address"],
        "vehicle_number": service["vehicle_number"],
        "service_type": service["service_type"],
        "description": service["description"],
        "service_date": service["service_date"],
        "amount": service["amount"],
        "status": service["status"],
        "created_at": service["created_at"]
    }
    
    return service_details

@router.delete("/services/{service_id}")
async def delete_service(service_id: str, current_user: User = Depends(get_current_user)):
    # Check if service exists
    existing_service = await db.services.find_one({"id": service_id})
    if not existing_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Delete the service
    result = await db.services.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"message": "Service deleted successfully", "deleted_service_id": service_id}
