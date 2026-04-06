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


# Sales endpoints
@router.post("/sales", response_model=Sale)
async def create_sale(sale_data: SaleCreate, current_user: User = Depends(get_current_user)):
    # Validate customer exists
    customer = await db.customers.find_one({"id": sale_data.customer_id})
    if not customer:
        raise HTTPException(status_code=400, detail="Customer not found")
    
    # Validate vehicle if provided
    if sale_data.vehicle_id:
        vehicle = await db.vehicles.find_one({"id": sale_data.vehicle_id})
        if not vehicle:
            raise HTTPException(status_code=400, detail="Vehicle not found")
        if vehicle['status'] != VehicleStatus.IN_STOCK:
            raise HTTPException(status_code=400, detail="Vehicle not available for sale")
    
    # Validate amount is positive
    if sale_data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    
    # Validate payment method
    valid_payment_methods = ["Cash", "Card", "UPI", "Bank Transfer", "Cheque", "Finance"]
    if sale_data.payment_method not in valid_payment_methods:
        raise HTTPException(status_code=400, detail=f"Invalid payment method. Must be one of: {', '.join(valid_payment_methods)}")
    
    # Generate invoice number (atomic — prevents duplicates under concurrent load)
    seq = await next_sequence("sales")
    invoice_number = f"INV-{seq:06d}"
    
    sale_dict = sale_data.dict()
    sale_dict['invoice_number'] = invoice_number
    sale_dict['created_by'] = current_user.id
    
    # Remove None sale_date to allow default factory to work
    if sale_dict.get('sale_date') is None:
        sale_dict.pop('sale_date', None)
    
    sale = Sale(**sale_dict)
    
    # Update vehicle status if vehicle_id provided
    if sale_data.vehicle_id:
        await db.vehicles.update_one(
            {"id": sale_data.vehicle_id},
            {"$set": {"status": VehicleStatus.SOLD, "customer_id": sale_data.customer_id, "date_sold": datetime.now(timezone.utc)}}
        )
    
    await db.sales.insert_one(sale.dict())
    
    # Create activity notification
    try:
        vehicle_info = ""
        if sale_data.vehicle_id:
            vehicle = await db.vehicles.find_one({"id": sale_data.vehicle_id}, {"_id": 0})
            if vehicle:
                vehicle_info = f" - {vehicle.get('brand', '')} {vehicle.get('model', '')}"
        
        await create_activity(ActivityCreate(
            type=ActivityType.SALE_CREATED,
            title="New sale recorded",
            description=f"{customer.get('name', 'Unknown')} - Invoice {invoice_number}{vehicle_info}",
            icon="success",
            metadata={"sale_id": sale.id, "customer_id": sale_data.customer_id, "invoice_number": invoice_number}
        ))
    except Exception as e:
        logger.warning(f"Failed to create activity for sale: {e}")
    
    return sale

@router.get("/sales")
async def get_sales(
    search: Optional[str] = None,
    source: Optional[str] = None,
    page: int = 1,
    limit: int = 100,
    sort: str = "sale_date",
    order: str = "desc",
    current_user: User = Depends(get_current_user)
):
    """Get sales with pagination and search. Designed for 2000+ records."""
    filter_dict = {}
    if source and source in ["direct", "import"]:
        filter_dict["source"] = source
    
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        filter_dict["$or"] = [
            {"invoice_number": search_regex},
            {"payment_method": search_regex},
            {"vehicle_brand": search_regex},
            {"vehicle_model": search_regex},
            {"vehicle_registration": search_regex},
        ]
    
    valid_sort_fields = ["sale_date", "amount", "invoice_number", "created_at"]
    if sort not in valid_sort_fields:
        sort = "sale_date"
    sort_direction = 1 if order == "asc" else -1
    
    skip = (page - 1) * limit
    total = await db.sales.count_documents(filter_dict)
    
    sales = await db.sales.find(filter_dict).sort(sort, sort_direction).skip(skip).limit(limit).to_list(limit)
    
    return {
        "data": [Sale(**sale).dict() for sale in sales],
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
    }

@router.get("/sales/summary/chart")
async def get_sales_summary(
    granularity: str = "monthly",
    years: int = 5,
    current_user: User = Depends(get_current_user)
):
    """Get sales summary for chart - monthly or yearly"""
    if granularity not in ["monthly", "yearly"]:
        raise HTTPException(status_code=400, detail="Granularity must be 'monthly' or 'yearly'")
    
    from datetime import datetime, timezone
    
    if granularity == "monthly":
        # Get last 12 months of data
        pipeline = [
            {
                "$addFields": {
                    "month": {"$month": "$sale_date"},
                    "year": {"$year": "$sale_date"}
                }
            },
            {
                "$group": {
                    "_id": {
                        "year": "$year",
                        "month": "$month"
                    },
                    "total_amount": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.year": 1, "_id.month": 1}},
            {"$limit": 12}
        ]
        
        results = await db.sales.aggregate(pipeline).to_list(None)
        
        labels = []
        values = []
        for result in results:
            month_name = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][result["_id"]["month"] - 1]
            labels.append(f"{month_name} {result['_id']['year']}")
            values.append(result["total_amount"])
        
        return {"labels": labels, "values": values, "granularity": "monthly"}
    
    else:  # yearly
        # Get last N years of data
        pipeline = [
            {
                "$addFields": {
                    "year": {"$year": "$sale_date"}
                }
            },
            {
                "$group": {
                    "_id": "$year",
                    "total_amount": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}},
            {"$limit": years}
        ]
        
        results = await db.sales.aggregate(pipeline).to_list(None)
        
        labels = [str(result["_id"]) for result in results]
        values = [result["total_amount"] for result in results]
        
        return {"labels": labels, "values": values, "granularity": "yearly"}

@router.get("/sales/{sale_id}", response_model=Sale)
async def get_sale(sale_id: str, current_user: User = Depends(get_current_user)):
    sale = await db.sales.find_one({"id": sale_id})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return Sale(**sale)

@router.put("/sales/{sale_id}", response_model=Sale)
async def update_sale(sale_id: str, sale_data: SaleCreate, current_user: User = Depends(get_current_user)):
    # Check if sale exists
    existing_sale = await db.sales.find_one({"id": sale_id})
    if not existing_sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Update sale data
    update_data = sale_data.dict(exclude_unset=True)
    update_data["id"] = sale_id  # Keep the original ID
    update_data["invoice_number"] = existing_sale["invoice_number"]  # Keep original invoice number
    update_data["created_by"] = existing_sale["created_by"]  # Keep original creator
    update_data["created_at"] = existing_sale["created_at"]  # Keep original creation date
    
    # If sale_date is provided, use it; otherwise keep existing
    if "sale_date" not in update_data or update_data["sale_date"] is None:
        update_data["sale_date"] = existing_sale["sale_date"]
    
    # Merge with existing data to preserve all fields
    merged_data = {**existing_sale, **update_data}
    
    updated_sale = Sale(**merged_data)
    await db.sales.replace_one({"id": sale_id}, updated_sale.dict())
    return updated_sale

@router.delete("/sales/{sale_id}")
async def delete_sale(sale_id: str, current_user: User = Depends(get_current_user)):
    # Check if sale exists
    existing_sale = await db.sales.find_one({"id": sale_id})
    if not existing_sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # If vehicle is associated, reset its status to in_stock
    if existing_sale.get("vehicle_id"):
        await db.vehicles.update_one(
            {"id": existing_sale["vehicle_id"]},
            {"$set": {"status": VehicleStatus.IN_STOCK}, "$unset": {"customer_id": "", "date_sold": ""}}
        )
    
    # Delete the sale
    result = await db.sales.delete_one({"id": sale_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    return {"message": "Sale deleted successfully", "deleted_sale_id": sale_id}

@router.delete("/sales")
async def bulk_delete_sales(request: BulkDeleteRequest, current_user: User = Depends(get_current_user)):
    """Bulk delete sales/invoices"""
    if not request.ids:
        raise HTTPException(status_code=400, detail="No sale IDs provided")
    
    deleted = []
    failed = []
    
    for sale_id in request.ids:
        try:
            # Check if sale exists
            existing_sale = await db.sales.find_one({"id": sale_id})
            if not existing_sale:
                failed.append({"id": sale_id, "error": "Sale not found"})
                continue
            
            # If vehicle is associated, reset its status to in_stock
            if existing_sale.get("vehicle_id"):
                await db.vehicles.update_one(
                    {"id": existing_sale["vehicle_id"]},
                    {"$set": {"status": VehicleStatus.IN_STOCK}, "$unset": {"customer_id": "", "date_sold": ""}}
                )
            
            # Delete the sale
            result = await db.sales.delete_one({"id": sale_id})
            if result.deleted_count > 0:
                deleted.append(sale_id)
            else:
                failed.append({"id": sale_id, "error": "Failed to delete"})
        except Exception as e:
            failed.append({"id": sale_id, "error": str(e)})
    
    return {
        "deleted": len(deleted),
        "deleted_ids": deleted,
        "failed": failed
    }
