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


# Vehicle endpoints
@router.post("/vehicles", response_model=Vehicle)
async def create_vehicle(vehicle_data: VehicleCreate, current_user: User = Depends(get_current_user)):
    # Check for duplicate chassis number
    if vehicle_data.chassis_number and await check_vehicle_duplicate(vehicle_data.chassis_number):
        raise HTTPException(status_code=400, detail=f"Vehicle with chassis number '{vehicle_data.chassis_number}' already exists")
    
    # Create vehicle dict and handle date_received
    vehicle_dict = vehicle_data.dict()
    if vehicle_dict.get('date_received') is None:
        vehicle_dict['date_received'] = datetime.now(timezone.utc)
    
    vehicle = Vehicle(**vehicle_dict)
    await db.vehicles.insert_one(vehicle.dict())
    
    # Create activity notification
    try:
        await create_activity(ActivityCreate(
            type=ActivityType.VEHICLE_ADDED,
            title="New vehicle added to stock",
            description=f"{vehicle_data.brand} {vehicle_data.model} - {vehicle_data.chassis_number}",
            icon="info",
            metadata={"vehicle_id": vehicle.id}
        ))
    except Exception as e:
        logger.warning(f"Failed to create activity for vehicle addition: {e}")
    
    return vehicle

@router.get("/vehicles")
async def get_vehicles(
    brand: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 100,
    sort: str = "date_received",
    order: str = "desc",
    current_user: User = Depends(get_current_user)
):
    """Get vehicles with pagination, filtering, and search. Designed for 4000+ records."""
    filter_dict = {}
    if brand:
        filter_dict["brand"] = brand
    if status:
        filter_dict["status"] = status
    
    # Server-side search across multiple fields
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        filter_dict["$or"] = [
            {"chassis_number": search_regex},
            {"engine_number": search_regex},
            {"model": search_regex},
            {"color": search_regex},
            {"vehicle_number": search_regex},
            {"key_number": search_regex},
        ]
    
    # Validate sort field
    valid_sort_fields = ["date_received", "brand", "model", "chassis_number", "status", "color"]
    if sort not in valid_sort_fields:
        sort = "date_received"
    sort_direction = 1 if order == "asc" else -1
    
    skip = (page - 1) * limit
    total = await db.vehicles.count_documents(filter_dict)
    
    vehicles = await db.vehicles.find(filter_dict).sort(sort, sort_direction).skip(skip).limit(limit).to_list(limit)
    
    return {
        "data": [Vehicle(**v).dict() for v in vehicles],
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
    }

@router.get("/vehicles/brands")
async def get_vehicle_brands(current_user: User = Depends(get_current_user)):
    brands = ["TVS", "BAJAJ", "HERO", "HONDA", "TRIUMPH", "KTM", "SUZUKI", "APRILIA", "YAMAHA", "PIAGGIO", "ROYAL ENFIELD"]
    return brands

@router.put("/vehicles/{vehicle_id}", response_model=Vehicle)
async def update_vehicle(vehicle_id: str, vehicle_data: VehicleUpdate, current_user: User = Depends(get_current_user)):
    # Check if vehicle exists
    existing_vehicle = await db.vehicles.find_one({"id": vehicle_id})
    if not existing_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Update vehicle data - only update fields that are provided
    update_data = {k: v for k, v in vehicle_data.dict().items() if v is not None}
    update_data["id"] = vehicle_id  # Keep the original ID
    
    # Handle date_returned if provided
    if "date_returned" in update_data and update_data["date_returned"]:
        try:
            from dateutil import parser as date_parser
            update_data["date_returned"] = date_parser.parse(update_data["date_returned"])
        except:
            pass
    
    # Merge existing data with updates
    merged_data = {**existing_vehicle, **update_data}
    
    updated_vehicle = Vehicle(**merged_data)
    await db.vehicles.replace_one({"id": vehicle_id}, updated_vehicle.dict())
    return updated_vehicle

@router.get("/vehicles/{vehicle_id}", response_model=Vehicle)
async def get_vehicle(vehicle_id: str, current_user: User = Depends(get_current_user)):
    vehicle = await db.vehicles.find_one({"id": vehicle_id})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return Vehicle(**vehicle)

class VehicleStatusUpdate(BaseModel):
    status: str
    return_date: Optional[str] = None
    outbound_location: Optional[str] = None

@router.put("/vehicles/{vehicle_id}/status")
async def update_vehicle_status(vehicle_id: str, status_data: VehicleStatusUpdate, current_user: User = Depends(get_current_user)):
    """Update vehicle status with optional return date"""
    # Check if vehicle exists
    existing_vehicle = await db.vehicles.find_one({"id": vehicle_id})
    if not existing_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Validate status
    new_status = status_data.status
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    # Validate status value
    valid_statuses = ["in_stock", "sold", "returned"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    # Prepare update data
    update_data = {"status": new_status}
    
    # Handle status-specific updates
    if new_status == "sold":
        update_data["date_sold"] = datetime.now(timezone.utc)
        # Clear return date if previously returned
        update_data["date_returned"] = None
    elif new_status == "returned":
        # Set return date
        return_date = status_data.return_date
        if return_date:
            try:
                # Parse the return date if provided
                update_data["date_returned"] = datetime.fromisoformat(return_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid return_date format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)")
        else:
            update_data["date_returned"] = datetime.now(timezone.utc)
        
        # Set outbound location if provided
        outbound_location = status_data.outbound_location
        if outbound_location:
            update_data["outbound_location"] = outbound_location
    elif new_status == "in_stock":
        # Clear sold/returned dates when back in stock
        update_data["date_sold"] = None
        update_data["date_returned"] = None
        update_data["customer_id"] = None
        update_data["outbound_location"] = None
    
    # Update the vehicle
    await db.vehicles.update_one({"id": vehicle_id}, {"$set": update_data})
    
    # Return updated vehicle
    updated_vehicle = await db.vehicles.find_one({"id": vehicle_id})
    return Vehicle(**updated_vehicle)

@router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, current_user: User = Depends(get_current_user)):
    # Check if vehicle exists
    existing_vehicle = await db.vehicles.find_one({"id": vehicle_id})
    if not existing_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Check if vehicle has associated sales records
    sales_count = await db.sales.count_documents({"vehicle_id": vehicle_id})
    if sales_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete vehicle. Vehicle has {sales_count} associated sales record(s). Please delete sales records first.")
    
    # Check if vehicle has associated service records
    services_count = await db.services.count_documents({"vehicle_id": vehicle_id})
    if services_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete vehicle. Vehicle has {services_count} associated service record(s). Please delete service records first.")
    
    # Delete the vehicle
    result = await db.vehicles.delete_one({"id": vehicle_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    return {"message": "Vehicle deleted successfully", "deleted_vehicle_id": vehicle_id}

@router.delete("/vehicles")
async def bulk_delete_vehicles(request: BulkDeleteRequest, current_user: User = Depends(get_current_user)):
    """Bulk delete vehicles with optional force delete (cascade)"""
    if not request.ids:
        raise HTTPException(status_code=400, detail="No vehicle IDs provided")
    
    deleted = []
    failed = []
    cascade_stats = {"sales": 0, "services": 0}
    
    for vehicle_id in request.ids:
        try:
            # Check if vehicle exists
            existing_vehicle = await db.vehicles.find_one({"id": vehicle_id})
            if not existing_vehicle:
                failed.append({"id": vehicle_id, "error": "Vehicle not found"})
                continue
            
            # Check for associated records
            sales_count = await db.sales.count_documents({"vehicle_id": vehicle_id})
            services_count = await db.services.count_documents({"vehicle_id": vehicle_id})
            
            # If force delete is enabled, delete associated records first
            if request.force_delete:
                # Delete associated sales
                if sales_count > 0:
                    sales_result = await db.sales.delete_many({"vehicle_id": vehicle_id})
                    cascade_stats["sales"] += sales_result.deleted_count
                
                # Delete associated services
                if services_count > 0:
                    services_result = await db.services.delete_many({"vehicle_id": vehicle_id})
                    cascade_stats["services"] += services_result.deleted_count
            else:
                # Normal delete - check for restrictions
                if sales_count > 0:
                    failed.append({"id": vehicle_id, "error": f"Vehicle has {sales_count} associated sales record(s)"})
                    continue
                
                if services_count > 0:
                    failed.append({"id": vehicle_id, "error": f"Vehicle has {services_count} associated service record(s)"})
                    continue
            
            # Delete the vehicle
            result = await db.vehicles.delete_one({"id": vehicle_id})
            if result.deleted_count > 0:
                deleted.append(vehicle_id)
            else:
                failed.append({"id": vehicle_id, "error": "Failed to delete"})
        except Exception as e:
            failed.append({"id": vehicle_id, "error": str(e)})
    
    response = {
        "deleted": len(deleted),
        "deleted_ids": deleted,
        "failed": failed
    }
    
    # Include cascade statistics if force delete was used
    if request.force_delete:
        response["cascade_deleted"] = cascade_stats
    
    return response
