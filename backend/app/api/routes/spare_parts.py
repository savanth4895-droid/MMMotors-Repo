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


# Spare Parts endpoints
@router.post("/spare-parts", response_model=SparePart)
async def create_spare_part(spare_part_data: SparePartCreate, current_user: User = Depends(get_current_user)):
    spare_part = SparePart(**spare_part_data.dict())
    await db.spare_parts.insert_one(spare_part.dict())
    return spare_part

@router.get("/spare-parts")
async def get_spare_parts(
    low_stock: bool = False,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 200,
    current_user: User = Depends(get_current_user)
):
    """Get spare parts with pagination and search. Designed for 1000+ records."""
    filter_dict = {}
    if low_stock:
        filter_dict = {"$expr": {"$lte": ["$quantity", "$low_stock_threshold"]}}
    
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        search_filter = {
            "$or": [
                {"name": search_regex},
                {"part_number": search_regex},
                {"brand": search_regex},
                {"compatible_models": search_regex},
            ]
        }
        if filter_dict:
            filter_dict = {"$and": [filter_dict, search_filter]}
        else:
            filter_dict = search_filter
    
    skip = (page - 1) * limit
    total = await db.spare_parts.count_documents(filter_dict)
    
    spare_parts = await db.spare_parts.find(filter_dict).skip(skip).limit(limit).to_list(limit)
    # Handle legacy spare parts that don't have GST fields
    processed_parts = []
    for part in spare_parts:
        # Add default values for missing GST fields
        if 'hsn_sac' not in part:
            part['hsn_sac'] = None
        if 'gst_percentage' not in part:
            part['gst_percentage'] = 18.0
        if 'unit' not in part:
            part['unit'] = 'Nos'
        if 'compatible_models' not in part:
            part['compatible_models'] = None
        processed_parts.append(SparePart(**part).dict())
    
    return {
        "data": processed_parts,
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
    }

@router.post("/spare-parts/bills", response_model=SparePartBill)
async def create_spare_part_bill(bill_data: SparePartBillCreate, current_user: User = Depends(get_current_user)):
    # Generate bill number (atomic)
    seq = await next_sequence("spare_part_bills")
    bill_number = f"SPB-{seq:06d}"
    
    bill_dict = bill_data.dict()
    bill_dict['bill_number'] = bill_number
    bill_dict['created_by'] = current_user.id
    
    # Handle customer data - prioritize customer_data over customer_id
    if bill_dict.get('customer_data'):
        # Use the new customer data format
        bill_dict['customer_id'] = None  # Clear legacy field
    elif bill_dict.get('customer_id'):
        # For backwards compatibility, keep customer_id if no customer_data
        pass
    else:
        raise HTTPException(status_code=400, detail="Customer information is required")
    
    # Ensure all GST fields are present with defaults if not provided
    if 'subtotal' not in bill_dict:
        bill_dict['subtotal'] = 0
    if 'total_discount' not in bill_dict:
        bill_dict['total_discount'] = 0
    if 'total_cgst' not in bill_dict:
        bill_dict['total_cgst'] = 0
    if 'total_sgst' not in bill_dict:
        bill_dict['total_sgst'] = 0
    if 'total_tax' not in bill_dict:
        bill_dict['total_tax'] = 0
    if 'total_amount' not in bill_dict:
        bill_dict['total_amount'] = bill_dict['subtotal'] + bill_dict['total_tax'] - bill_dict['total_discount']
    
    bill = SparePartBill(**bill_dict)
    
    await db.spare_part_bills.insert_one(bill.dict())
    return bill

@router.get("/spare-parts/bills", response_model=List[SparePartBill])
async def get_spare_part_bills(current_user: User = Depends(get_current_user)):
    bills = await db.spare_part_bills.find().to_list(1000)
    # Handle legacy bills that don't have GST fields or customer data
    processed_bills = []
    for bill in bills:
        # Add default values for missing GST fields
        if 'subtotal' not in bill:
            bill['subtotal'] = bill.get('total_amount', 0)
        if 'total_discount' not in bill:
            bill['total_discount'] = 0
        if 'total_cgst' not in bill:
            bill['total_cgst'] = 0
        if 'total_sgst' not in bill:
            bill['total_sgst'] = 0
        if 'total_tax' not in bill:
            bill['total_tax'] = 0
        # Handle customer data backwards compatibility
        if 'customer_data' not in bill:
            bill['customer_data'] = None
        if 'customer_id' not in bill:
            bill['customer_id'] = None
        processed_bills.append(SparePartBill(**bill))
    return processed_bills

@router.delete("/spare-parts/bills/{bill_id}")
async def delete_spare_part_bill(bill_id: str, current_user: User = Depends(get_current_user)):
    # Check if spare part bill exists
    existing_bill = await db.spare_part_bills.find_one({"id": bill_id})
    if not existing_bill:
        raise HTTPException(status_code=404, detail="Spare part bill not found")
    
    # Delete the spare part bill
    result = await db.spare_part_bills.delete_one({"id": bill_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Spare part bill not found")
    
    return {"message": "Spare part bill deleted successfully", "deleted_bill_id": bill_id}

# Service Bills API Endpoints
@router.post("/service-bills", response_model=ServiceBill)
async def create_service_bill(bill_data: ServiceBillCreate, current_user: User = Depends(get_current_user)):
    # Generate bill number if not provided
    if not bill_data.bill_number:
        seq = await next_sequence("service_bills")
        bill_data.bill_number = f"SB-{seq:06d}"
    
    # Get customer info if customer_id is provided
    customer_name = bill_data.customer_name
    customer_mobile = bill_data.customer_mobile
    
    if bill_data.customer_id and not customer_name:
        customer = await db.customers.find_one({"id": bill_data.customer_id})
        if customer:
            customer_name = customer.get("name", "")
            customer_mobile = customer.get("mobile", customer.get("phone", ""))
    
    # Parse bill date
    bill_date = datetime.now(timezone.utc)
    if bill_data.bill_date:
        try:
            bill_date = datetime.fromisoformat(bill_data.bill_date.replace('Z', '+00:00'))
        except:
            pass
    
    # Reduce spare part quantities for items that have spare_part_id
    spare_part_updates = []
    if bill_data.items:
        for item in bill_data.items:
            if isinstance(item, dict) and item.get("spare_part_id"):
                spare_part_id = item["spare_part_id"]
                qty_used = item.get("qty", 1)
                
                # Check if spare part exists and has enough quantity
                spare_part = await db.spare_parts.find_one({"id": spare_part_id})
                if spare_part:
                    current_qty = spare_part.get("quantity", 0)
                    new_qty = max(0, current_qty - qty_used)  # Don't go below 0
                    
                    # Update spare part quantity
                    await db.spare_parts.update_one(
                        {"id": spare_part_id},
                        {"$set": {"quantity": new_qty}}
                    )
                    spare_part_updates.append({
                        "part_id": spare_part_id,
                        "part_name": spare_part.get("name", "Unknown"),
                        "qty_used": qty_used,
                        "old_qty": current_qty,
                        "new_qty": new_qty
                    })
    
    bill = ServiceBill(
        bill_number=bill_data.bill_number,
        job_card_number=bill_data.job_card_number,
        customer_id=bill_data.customer_id,
        customer_name=customer_name,
        customer_mobile=customer_mobile,
        vehicle_number=bill_data.vehicle_number,
        vehicle_brand=bill_data.vehicle_brand,
        vehicle_model=bill_data.vehicle_model,
        items=bill_data.items,
        subtotal=bill_data.subtotal,
        total_discount=bill_data.total_discount,
        total_cgst=bill_data.total_cgst,
        total_sgst=bill_data.total_sgst,
        total_tax=bill_data.total_tax,
        total_amount=bill_data.total_amount,
        bill_date=bill_date,
        status=bill_data.status,
        created_by=current_user.username
    )
    
    await db.service_bills.insert_one(bill.dict())
    
    # Log spare part inventory updates
    if spare_part_updates:
        print(f"Spare part inventory updated for bill {bill.bill_number}: {spare_part_updates}")
    
    return bill

@router.get("/service-bills")
async def get_service_bills(current_user: User = Depends(get_current_user)):
    bills = await db.service_bills.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return bills

@router.get("/service-bills/{bill_id}")
async def get_service_bill(bill_id: str, current_user: User = Depends(get_current_user)):
    bill = await db.service_bills.find_one({"id": bill_id}, {"_id": 0})
    if not bill:
        raise HTTPException(status_code=404, detail="Service bill not found")
    return bill

@router.put("/service-bills/{bill_id}/status")
async def update_service_bill_status(bill_id: str, status_update: dict, current_user: User = Depends(get_current_user)):
    existing_bill = await db.service_bills.find_one({"id": bill_id})
    if not existing_bill:
        raise HTTPException(status_code=404, detail="Service bill not found")
    
    new_status = status_update.get("status", "unpaid")
    if new_status not in ["paid", "unpaid"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'paid' or 'unpaid'")
    
    await db.service_bills.update_one(
        {"id": bill_id},
        {"$set": {"status": new_status}}
    )
    
    return {"message": f"Bill status updated to {new_status}", "bill_id": bill_id, "status": new_status}

@router.put("/service-bills/{bill_id}")
async def update_service_bill(bill_id: str, bill_update: dict, current_user: User = Depends(get_current_user)):
    """Full update of service bill including items"""
    existing_bill = await db.service_bills.find_one({"id": bill_id})
    if not existing_bill:
        raise HTTPException(status_code=404, detail="Service bill not found")
    
    # Build update data
    update_data = {}
    
    if "bill_number" in bill_update:
        update_data["bill_number"] = bill_update["bill_number"]
        update_data["job_card_number"] = bill_update["bill_number"]  # Keep both in sync
    
    if "customer_name" in bill_update:
        update_data["customer_name"] = bill_update["customer_name"]
    
    if "vehicle_reg_no" in bill_update:
        update_data["vehicle_reg_no"] = bill_update["vehicle_reg_no"]
    
    if "status" in bill_update:
        update_data["status"] = bill_update["status"]
    
    if "amount" in bill_update:
        update_data["amount"] = bill_update["amount"]
    
    if "items" in bill_update:
        update_data["items"] = bill_update["items"]
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.service_bills.update_one(
        {"id": bill_id},
        {"$set": update_data}
    )
    
    # Return updated bill
    updated_bill = await db.service_bills.find_one({"id": bill_id}, {"_id": 0})
    return updated_bill

@router.delete("/service-bills/{bill_id}")
async def delete_service_bill(bill_id: str, current_user: User = Depends(get_current_user)):
    existing_bill = await db.service_bills.find_one({"id": bill_id})
    if not existing_bill:
        raise HTTPException(status_code=404, detail="Service bill not found")
    
    result = await db.service_bills.delete_one({"id": bill_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service bill not found")
    
    return {"message": "Service bill deleted successfully", "deleted_bill_id": bill_id}

@router.get("/spare-parts/{part_id}", response_model=SparePart)
async def get_spare_part(part_id: str, current_user: User = Depends(get_current_user)):
    part = await db.spare_parts.find_one({"id": part_id})
    if not part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    
    # Handle legacy spare parts that don't have GST fields
    if 'hsn_sac' not in part:
        part['hsn_sac'] = None
    if 'gst_percentage' not in part:
        part['gst_percentage'] = 18.0
    if 'unit' not in part:
        part['unit'] = 'Nos'
    if 'compatible_models' not in part:
        part['compatible_models'] = None
    
    return SparePart(**part)

@router.put("/spare-parts/{part_id}", response_model=SparePart)
async def update_spare_part(part_id: str, spare_part_data: SparePartCreate, current_user: User = Depends(get_current_user)):
    # Check if spare part exists
    existing_part = await db.spare_parts.find_one({"id": part_id})
    if not existing_part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    
    # Update spare part data
    update_data = spare_part_data.dict()
    update_data["id"] = part_id  # Keep the original ID
    update_data["created_at"] = existing_part["created_at"]  # Keep original creation date
    
    updated_part = SparePart(**update_data)
    await db.spare_parts.replace_one({"id": part_id}, updated_part.dict())
    return updated_part

@router.delete("/spare-parts/{part_id}")
async def delete_spare_part(part_id: str, current_user: User = Depends(get_current_user)):
    # Check if spare part exists
    existing_part = await db.spare_parts.find_one({"id": part_id})
    if not existing_part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    
    # Check if spare part is referenced in any bills
    bills_count = await db.spare_part_bills.count_documents({"items.part_id": part_id})
    if bills_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete spare part. Part is referenced in {bills_count} bill(s). Please remove from bills first.")
    
    # Delete the spare part
    result = await db.spare_parts.delete_one({"id": part_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Spare part not found")
    
    return {"message": "Spare part deleted successfully", "deleted_part_id": part_id}
