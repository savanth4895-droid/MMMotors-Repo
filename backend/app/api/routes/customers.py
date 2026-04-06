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
from app.core.utils import parse_date_flexible, safe_str

router = APIRouter()
logger = logging.getLogger(__name__)


# Customer endpoints
@router.post("/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate, current_user: User = Depends(get_current_user)):
    # Check for duplicate mobile number
    if customer_data.mobile and await check_customer_duplicate(customer_data.mobile):
        raise HTTPException(status_code=400, detail=f"Customer with mobile number '{customer_data.mobile}' already exists")
    
    customer = Customer(**customer_data.dict())
    await db.customers.insert_one(customer.dict())
    return customer

@router.get("/customers")
async def get_customers(
    page: int = 1,
    limit: int = 100,
    sort: str = "created_at",
    order: str = "desc",
    current_user: User = Depends(get_current_user)
):
    # Validate sort field
    valid_sort_fields = ["name", "mobile", "created_at", "total_purchases"]
    if sort not in valid_sort_fields:
        raise HTTPException(status_code=400, detail=f"Invalid sort field. Must be one of: {', '.join(valid_sort_fields)}")
    
    # Validate order
    if order not in ["asc", "desc"]:
        raise HTTPException(status_code=400, detail="Invalid order. Must be 'asc' or 'desc'")
    
    # Calculate skip
    skip = (page - 1) * limit
    
    # Build sort criteria
    sort_direction = 1 if order == "asc" else -1
    
    # For total_purchases, we need to aggregate
    if sort == "total_purchases":
        # Aggregate to calculate total purchases
        pipeline = [
            {
                "$lookup": {
                    "from": "sales",
                    "localField": "id",
                    "foreignField": "customer_id",
                    "as": "sales"
                }
            },
            {
                "$addFields": {
                    "total_purchases": {"$size": "$sales"}
                }
            },
            {"$sort": {"total_purchases": sort_direction}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        customers = await db.customers.aggregate(pipeline).to_list(None)
        
        # Get total count
        total = await db.customers.count_documents({})
    else:
        # Regular sort
        customers = await db.customers.find().sort(sort, sort_direction).skip(skip).limit(limit).to_list(None)
        total = await db.customers.count_documents({})
    
    # Convert ObjectId to string for JSON serialization
    for customer in customers:
        if '_id' in customer:
            customer['_id'] = str(customer['_id'])
    
    # Calculate total pages
    total_pages = (total + limit - 1) // limit
    
    return {
        "data": customers,
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": total_pages
        }
    }

@router.get("/customers/{customer_id}")
async def get_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    # Convert ObjectId to string for JSON serialization
    if '_id' in customer:
        customer['_id'] = str(customer['_id'])
    return customer

@router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_data: CustomerCreate, current_user: User = Depends(get_current_user)):
    # Check if customer exists
    existing_customer = await db.customers.find_one({"id": customer_id})
    if not existing_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Prepare update data by merging with existing data to preserve nested fields
    update_data = customer_data.dict(exclude_unset=True)  # Only include fields that were explicitly set
    
    # Always preserve these fields
    update_data["id"] = customer_id  # Keep the original ID
    update_data["created_at"] = existing_customer["created_at"]  # Keep original creation date
    
    # Merge nested fields to preserve existing data
    # Handle vehicle_info preservation
    if "vehicle_info" in update_data:
        existing_vehicle_info = existing_customer.get("vehicle_info", {})
        if existing_vehicle_info and update_data["vehicle_info"]:
            # Merge existing vehicle_info with new vehicle_info
            merged_vehicle_info = {**existing_vehicle_info, **update_data["vehicle_info"]}
            update_data["vehicle_info"] = merged_vehicle_info
    else:
        # Preserve existing vehicle_info if not included in update
        if "vehicle_info" in existing_customer:
            update_data["vehicle_info"] = existing_customer["vehicle_info"]
    
    # Handle insurance_info preservation
    if "insurance_info" in update_data:
        existing_insurance_info = existing_customer.get("insurance_info", {})
        if existing_insurance_info and update_data["insurance_info"]:
            # Merge existing insurance_info with new insurance_info
            merged_insurance_info = {**existing_insurance_info, **update_data["insurance_info"]}
            update_data["insurance_info"] = merged_insurance_info
    else:
        # Preserve existing insurance_info if not included in update
        if "insurance_info" in existing_customer:
            update_data["insurance_info"] = existing_customer["insurance_info"]
    
    # Handle sales_info preservation
    if "sales_info" in update_data:
        existing_sales_info = existing_customer.get("sales_info", {})
        if existing_sales_info and update_data["sales_info"]:
            # Merge existing sales_info with new sales_info
            merged_sales_info = {**existing_sales_info, **update_data["sales_info"]}
            update_data["sales_info"] = merged_sales_info
    else:
        # Preserve existing sales_info if not included in update
        if "sales_info" in existing_customer:
            update_data["sales_info"] = existing_customer["sales_info"]
    
    # Create the complete updated customer data by merging with existing
    complete_update_data = {**existing_customer, **update_data}
    
    updated_customer = Customer(**complete_update_data)
    await db.customers.replace_one({"id": customer_id}, updated_customer.dict())
    return updated_customer

@router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    # Check if customer exists
    existing_customer = await db.customers.find_one({"id": customer_id})
    if not existing_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if customer has associated sales records
    sales_count = await db.sales.count_documents({"customer_id": customer_id})
    if sales_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete customer. Customer has {sales_count} associated sales record(s). Please delete sales records first.")
    
    # Delete the customer
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return {"message": "Customer deleted successfully", "deleted_customer_id": customer_id}

class BulkDeleteRequest(BaseModel):
    ids: List[str]
    force_delete: bool = False

@router.delete("/customers")
async def bulk_delete_customers(request: BulkDeleteRequest, current_user: User = Depends(get_current_user)):
    """Bulk delete customers"""
    if not request.ids:
        raise HTTPException(status_code=400, detail="No customer IDs provided")
    
    deleted = []
    failed = []
    
    for customer_id in request.ids:
        try:
            # Check if customer exists
            existing_customer = await db.customers.find_one({"id": customer_id})
            if not existing_customer:
                failed.append({"id": customer_id, "error": "Customer not found"})
                continue
            
            # Check if customer has associated sales records
            sales_count = await db.sales.count_documents({"customer_id": customer_id})
            if sales_count > 0:
                failed.append({"id": customer_id, "error": f"Customer has {sales_count} associated sales record(s)"})
                continue
            
            # Delete the customer
            result = await db.customers.delete_one({"id": customer_id})
            if result.deleted_count > 0:
                deleted.append(customer_id)
            else:
                failed.append({"id": customer_id, "error": "Failed to delete"})
        except Exception as e:
            failed.append({"id": customer_id, "error": str(e)})
    
    return {
        "deleted": len(deleted),
        "deleted_ids": deleted,
        "failed": failed
    }
