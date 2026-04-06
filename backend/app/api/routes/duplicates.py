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


# Duplicate Detection and Cleanup endpoints
@router.get("/duplicates/detect")
async def detect_duplicates(current_user: User = Depends(get_current_user)):
    """Detect duplicate records across all collections"""
    duplicates = {
        "vehicles": {},
        "customers": {},
        "summary": {}
    }
    
    # Find duplicate vehicles by chassis_number
    vehicle_pipeline = [
        {"$match": {"chassis_number": {"$ne": None, "$ne": ""}}},
        {"$group": {
            "_id": "$chassis_number",
            "count": {"$sum": 1},
            "ids": {"$push": "$id"},
            "records": {"$push": "$$ROOT"}
        }},
        {"$match": {"count": {"$gt": 1}}}
    ]
    
    vehicle_duplicates = await db.vehicles.aggregate(vehicle_pipeline).to_list(1000)
    
    # Find duplicate customers by mobile
    customer_pipeline = [
        {"$match": {"mobile": {"$ne": None, "$ne": ""}}},
        {"$group": {
            "_id": "$mobile", 
            "count": {"$sum": 1},
            "ids": {"$push": "$id"},
            "records": {"$push": "$$ROOT"}
        }},
        {"$match": {"count": {"$gt": 1}}}
    ]
    
    customer_duplicates = await db.customers.aggregate(customer_pipeline).to_list(1000)
    
    # Process vehicle duplicates
    total_vehicle_duplicates = 0
    for duplicate in vehicle_duplicates:
        chassis_no = duplicate["_id"]
        duplicates["vehicles"][chassis_no] = {
            "count": duplicate["count"],
            "ids": duplicate["ids"],
            "records": [{"id": r["id"], "brand": r.get("brand"), "model": r.get("model"), "color": r.get("color")} for r in duplicate["records"]]
        }
        total_vehicle_duplicates += duplicate["count"] - 1  # Subtract 1 to keep original
    
    # Process customer duplicates
    total_customer_duplicates = 0
    for duplicate in customer_duplicates:
        mobile = duplicate["_id"]
        duplicates["customers"][mobile] = {
            "count": duplicate["count"],
            "ids": duplicate["ids"],
            "records": [{"id": r["id"], "name": r.get("name"), "email": r.get("email")} for r in duplicate["records"]]
        }
        total_customer_duplicates += duplicate["count"] - 1  # Subtract 1 to keep original
    
    duplicates["summary"] = {
        "total_vehicle_duplicates": total_vehicle_duplicates,
        "total_customer_duplicates": total_customer_duplicates,
        "vehicle_chassis_groups": len(vehicle_duplicates),
        "customer_mobile_groups": len(customer_duplicates)
    }
    
    return duplicates

@router.post("/duplicates/cleanup")
async def cleanup_duplicates(current_user: User = Depends(get_current_user)):
    """Remove duplicate records, keeping the oldest one in each group"""
    
    cleanup_results = {
        "vehicles_removed": 0,
        "customers_removed": 0,
        "removed_vehicle_ids": [],
        "removed_customer_ids": []
    }
    
    # Clean up duplicate vehicles by chassis_number
    vehicle_pipeline = [
        {"$match": {"chassis_number": {"$ne": None, "$ne": ""}}},
        {"$group": {
            "_id": "$chassis_number",
            "count": {"$sum": 1},
            "records": {"$push": "$$ROOT"}
        }},
        {"$match": {"count": {"$gt": 1}}}
    ]
    
    vehicle_duplicates = await db.vehicles.aggregate(vehicle_pipeline).to_list(1000)
    
    for duplicate_group in vehicle_duplicates:
        records = duplicate_group["records"]
        # Sort by created_at to keep the oldest
        records.sort(key=lambda x: x.get("date_received", datetime.now(timezone.utc)))
        
        # Keep the first (oldest) and remove the rest
        to_remove = records[1:]
        for record in to_remove:
            # Check if vehicle is not associated with sales/services
            sales_count = await db.sales.count_documents({"vehicle_id": record["id"]})
            services_count = await db.services.count_documents({"vehicle_id": record["id"]})
            
            if sales_count == 0 and services_count == 0:
                await db.vehicles.delete_one({"id": record["id"]})
                cleanup_results["vehicles_removed"] += 1
                cleanup_results["removed_vehicle_ids"].append(record["id"])
    
    # Clean up duplicate customers by mobile
    customer_pipeline = [
        {"$match": {"mobile": {"$ne": None, "$ne": ""}}},
        {"$group": {
            "_id": "$mobile",
            "count": {"$sum": 1},
            "records": {"$push": "$$ROOT"}
        }},
        {"$match": {"count": {"$gt": 1}}}
    ]
    
    customer_duplicates = await db.customers.aggregate(customer_pipeline).to_list(1000)
    
    for duplicate_group in customer_duplicates:
        records = duplicate_group["records"]
        # Sort by created_at to keep the oldest
        records.sort(key=lambda x: x.get("created_at", datetime.now(timezone.utc)))
        
        # Keep the first (oldest) and remove the rest
        to_remove = records[1:]
        for record in to_remove:
            # Check if customer is not associated with sales/services
            sales_count = await db.sales.count_documents({"customer_id": record["id"]})
            services_count = await db.services.count_documents({"customer_id": record["id"]})
            
            if sales_count == 0 and services_count == 0:
                await db.customers.delete_one({"id": record["id"]})
                cleanup_results["customers_removed"] += 1
                cleanup_results["removed_customer_ids"].append(record["id"])
    
    return cleanup_results

