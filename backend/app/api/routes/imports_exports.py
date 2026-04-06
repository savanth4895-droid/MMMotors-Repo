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


# Import/Export endpoints
@router.post("/import/upload", response_model=ImportResult)
async def upload_import_file(
    data_type: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload and process import file"""
    
    # Validate data type
    valid_types = ["customers", "vehicles", "spare_parts", "services"]
    if data_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid data type. Must be one of: {valid_types}")
    
    # Validate file format
    if not file.filename or not (file.filename.endswith('.csv') or file.filename.endswith('.xlsx')):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
    
    # Create import job
    import_job = ImportJob(
        file_name=file.filename,
        data_type=data_type,
        status="processing",
        created_by=current_user.id
    )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Parse file based on type
        if file.filename.endswith('.csv'):
            data = await parse_csv_file(file_content)
        else:
            data = await parse_excel_file(file_content)
        
        import_job.total_records = len(data)
        
        # Process import based on data type
        if data_type == "customers":
            result = await import_customers_data(data, import_job, current_user.id)
        elif data_type == "vehicles":
            result = await import_vehicles_data(data, import_job, current_user.id)
        elif data_type == "spare_parts":
            result = await import_spare_parts_data(data, import_job, current_user.id)
        elif data_type == "services":
            result = await import_services_data(data, import_job, current_user.id)
        
        import_job.status = "completed"
        import_job.end_time = datetime.now(timezone.utc)
        
    except Exception as e:
        import_job.status = "failed"
        import_job.end_time = datetime.now(timezone.utc)
        import_job.errors.append({"error": str(e), "row": 0})
        result = ImportResult(
            job_id=import_job.id,
            status="failed",
            message=str(e)
        )
    
    # Save import job to database
    await db.import_jobs.insert_one(import_job.dict())
    
    return result

@router.get("/import/jobs", response_model=List[ImportJob])
async def get_import_jobs(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get import job history"""
    jobs = await db.import_jobs.find().skip(skip).limit(limit).sort("created_at", -1).to_list(length=None)
    return [ImportJob(**job) for job in jobs]

@router.get("/import/template/{data_type}")
async def download_import_template(
    data_type: str,
    current_user: User = Depends(get_current_user)
):
    """Download CSV template for import"""
    from fastapi.responses import Response
    
    templates = {
        "customers": "name,care_of,mobile,email,address,brand,model,color,vehicle_number,chassis_number,engine_number,nominee_name,relation,age,sale_amount,payment_method,hypothecation,sale_date,invoice_number\nJohn Doe,S/O Ramesh,9876543210,john@example.com,\"123 Main St, Bangalore\",TVS,Apache RTR 160,Red,KA01AB1234,ABC123456789012345,ENG987654321,Jane Doe,spouse,28,75000,cash,cash,2024-01-15,INV001\nJane Smith,D/O Kumar,9876543211,jane@example.com,\"456 Oak Ave, Mysore\",BAJAJ,Pulsar 150,Blue,KA02CD5678,DEF123456789012345,ENG987654322,John Smith,father,55,65000,finance,\"Bank Finance\",2024-01-16,INV002",
        "vehicles": "date_received,brand,model,chassis_number,engine_number,color,vehicle_number,key_number,inbound_location,page_number,status,customer_mobile,customer_name,sale_amount,payment_method\n2025-01-15,TVS,Apache RTR 160,ABC123456789,ENG987654321,Red,KA01AB1234,KEY001,Warehouse A,Page 1,in_stock,9876543210,John Doe,75000,cash\n2025-01-16,BAJAJ,Pulsar 150,DEF123456789,ENG987654322,Blue,KA02CD5678,KEY002,Warehouse B,Page 2,in_stock,9876543211,Jane Smith,65000,finance",
        "spare_parts": "name,part_number,brand,quantity,unit,unit_price,hsn_sac,gst_percentage,supplier,compatible_models\nBrake Pad,BP001,TVS,50,Nos,250.00,87084090,18.0,ABC Supplies,\"Apache RTR 160, Pulsar 150\"\nEngine Oil,EO001,CASTROL,25,Ltr,450.00,27101981,28.0,XYZ Motors,\"All Models\"",
        "services": "registration_date,customer_name,customer_mobile,vehicle_number,chassis_number,vehicle_brand,vehicle_model,vehicle_year,service_type,description,amount\n2025-01-15,John Doe,9876543210,KA01AB1234,ABC123456789,TVS,Apache RTR 160,2024,periodic_service,General servicing,1500.00\n2025-01-16,Jane Smith,9876543211,KA02CD5678,DEF123456789,BAJAJ,Pulsar 150,2023,repair,Brake repair,800.00"
    }
    
    if data_type not in templates:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return Response(
        content=templates[data_type],
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={data_type}_template.csv"}
    )

# Helper functions for file parsing and data import
async def parse_csv_file(file_content: bytes) -> List[Dict]:
    """Parse CSV file content with multiple encoding support"""
    # List of encodings to try in order of preference
    encodings = ['utf-8', 'iso-8859-1', 'windows-1252', 'cp1252']
    
    content = None
    successful_encoding = None
    
    for encoding in encodings:
        try:
            content = file_content.decode(encoding)
            successful_encoding = encoding
            break
        except UnicodeDecodeError:
            continue
    
    # If all encodings fail, use UTF-8 with error handling
    if content is None:
        content = file_content.decode('utf-8', errors='replace')
        successful_encoding = 'utf-8 (with error replacement)'
    
    # Log which encoding was used for debugging
    logging.info(f"CSV file parsed successfully using encoding: {successful_encoding}")
    
    csv_reader = csv.DictReader(io.StringIO(content))
    return list(csv_reader)

# Cross-reference utility functions for unified data import
async def find_customer_by_mobile(mobile: str) -> Optional[Dict]:
    """Find existing customer by mobile number"""
    if not mobile or mobile == "0000000000":
        return None
    return await db.customers.find_one({"mobile": mobile})

async def find_vehicle_by_identifiers(vehicle_number: Optional[str] = None, chassis_number: Optional[str] = None) -> Optional[Dict]:
    """Find existing vehicle by vehicle_number or chassis_number"""
    if not vehicle_number and not chassis_number:
        return None
    
    query = []
    if vehicle_number:
        query.append({"vehicle_number": vehicle_number})
    if chassis_number:
        query.append({"chassis_number": chassis_number})
    
    if query:
        return await db.vehicles.find_one({"$or": query})
    return None

async def find_or_create_customer(mobile: str, data: Dict, import_stats: Dict) -> str:
    """Find existing customer by mobile or create new one"""
    # Try to find existing customer
    existing_customer = await find_customer_by_mobile(mobile)
    if existing_customer:
        import_stats['customers_linked'] = import_stats.get('customers_linked', 0) + 1
        return existing_customer['id']
    
    # Create new customer with available data
    customer_data = CustomerCreate(
        name=data.get('name', 'Unknown Customer'),
        mobile=mobile,
        email=data.get('email') or None,
        address=data.get('address', 'Address not provided'),
        care_of=data.get('care_of') or None
    )
    
    customer = Customer(**customer_data.dict())
    await db.customers.insert_one(customer.dict())
    import_stats['customers_created'] = import_stats.get('customers_created', 0) + 1
    return customer.id

async def find_or_create_vehicle(vehicle_number: Optional[str], chassis_number: Optional[str], data: Dict, import_stats: Dict) -> Optional[str]:
    """Find existing vehicle or create new one"""
    # Try to find existing vehicle
    existing_vehicle = await find_vehicle_by_identifiers(vehicle_number, chassis_number)
    if existing_vehicle:
        import_stats['vehicles_linked'] = import_stats.get('vehicles_linked', 0) + 1
        return existing_vehicle['id']
    
    # Create new vehicle if we have enough data
    if not chassis_number and not vehicle_number:
        return None
    
    vehicle_data = VehicleCreate(
        brand=data.get('brand', 'UNKNOWN'),
        model=data.get('model', 'Unknown Model'),
        chassis_number=chassis_number or f'AUTO-{str(uuid.uuid4())[:8]}',
        engine_number=data.get('engine_number', 'Unknown Engine'),
        color=data.get('color', 'Unknown Color'),
        vehicle_number=vehicle_number,
        key_number=data.get('key_number')
    )
    
    vehicle = Vehicle(**vehicle_data.dict())
    await db.vehicles.insert_one(vehicle.dict())
    import_stats['vehicles_created'] = import_stats.get('vehicles_created', 0) + 1
    return vehicle.id

async def check_customer_duplicate(mobile: str) -> bool:
    """Check if customer with mobile number already exists"""
    existing = await find_customer_by_mobile(mobile)
    return existing is not None

async def check_vehicle_duplicate(chassis_number: str) -> bool:
    """Check if vehicle with chassis number already exists"""
    existing = await db.vehicles.find_one({"chassis_number": chassis_number})
    return existing is not None

async def parse_excel_file(file_content: bytes) -> List[Dict]:
    """Parse Excel file content"""
    df = pd.read_excel(io.BytesIO(file_content))
    return df.to_dict('records')

async def import_customers_data(data: List[Dict], import_job: ImportJob, user_id: str) -> ImportResult:
    """Import customers data with vehicle and insurance information and cross-referencing"""
    successful = 0
    failed = 0
    skipped = 0
    errors = []
    incomplete_records = []
    import_stats = {
        'vehicles_linked': 0,
        'sales_created': 0
    }
    
    for idx, row in enumerate(data):
        try:
            # Get phone number from either 'mobile' or 'phone' field - use safe_str
            phone_number = safe_str(row.get('mobile', '')) or safe_str(row.get('phone', ''))
            
            # Get name and phone with fallbacks (no longer required)
            name = safe_str(row.get('name', ''))
            if not name:
                name = "Customer"
            if not phone_number:
                phone_number = "0000000000"  # Default phone number
            
            # Get address with fallback to empty string if not provided
            address = safe_str(row.get('address', ''))
            if not address:
                address = "Address not provided"
            
            # Check for duplicate customer before processing
            if phone_number and phone_number != "0000000000":
                existing_customer = await db.customers.find_one({"mobile": phone_number})
                if existing_customer:
                    # Skip duplicate customer (don't count as error)
                    skipped += 1
                    continue
            
            # Create basic customer record
            customer_data = CustomerCreate(
                name=name,
                mobile=phone_number,
                email=safe_str(row.get('email', '')) or None,
                address=address,
                care_of=safe_str(row.get('care_of', '')) or None
            )
            
            customer = Customer(**customer_data.dict())
            
            # Add vehicle and insurance information as extended data
            vehicle_info = {}
            insurance_info = {}
            sales_info = {}
            
            # Map vehicle fields from CSV template (support both old and new field names)
            if (row.get('brand') or row.get('model') or 
                row.get('vehicle_no') or row.get('vehicle_number') or 
                row.get('chassis_no') or row.get('chassis_number')):
                vehicle_info = {
                    'brand': safe_str(row.get('brand', '')),
                    'model': safe_str(row.get('model', '')), 
                    'color': safe_str(row.get('color', '')),
                    'vehicle_number': (safe_str(row.get('vehicle_number', '')) or 
                                     safe_str(row.get('vehicle_no', ''))),
                    'chassis_number': (safe_str(row.get('chassis_number', '')) or 
                                     safe_str(row.get('chassis_no', ''))),
                    'engine_number': (safe_str(row.get('engine_number', '')) or 
                                    safe_str(row.get('engine_no', '')))
                }
            
            # Map insurance nominee fields (using actual CSV column names)
            if row.get('nominee_name') or row.get('relation') or row.get('age'):
                insurance_info = {
                    'nominee_name': safe_str(row.get('nominee_name', '')),
                    'relation': safe_str(row.get('relation', '')),
                    'age': safe_str(row.get('age', ''))
                }
            
            # Map sales information if available
            if row.get('sale_amount') or row.get('payment_method'):
                sales_info = {
                    'amount': safe_str(row.get('sale_amount', '')),
                    'payment_method': safe_str(row.get('payment_method', '')),
                    'hypothecation': safe_str(row.get('hypothecation', '')),
                    'sale_date': safe_str(row.get('sale_date', '')),
                    'invoice_number': safe_str(row.get('invoice_number', ''))
                }
            
            # Create basic customer record
            customer_data = CustomerCreate(
                name=name,
                mobile=phone_number,
                email=safe_str(row.get('email', '')) or None,
                address=address,
                care_of=safe_str(row.get('care_of', '')) or None
            )
            
            customer = Customer(**customer_data.dict())
            
            # Add extended information to customer record
            customer_dict = customer.dict()
            if vehicle_info and any(vehicle_info.values()):
                customer_dict['vehicle_info'] = vehicle_info
            if insurance_info and any(insurance_info.values()):
                customer_dict['insurance_info'] = insurance_info
            if sales_info and any(sales_info.values()):
                customer_dict['sales_info'] = sales_info
            
            await db.customers.insert_one(customer_dict)
            
            # CROSS-REFERENCE: Try to link to existing vehicle
            if vehicle_info.get('chassis_number') or vehicle_info.get('vehicle_number'):
                existing_vehicle = await find_vehicle_by_identifiers(
                    vehicle_info.get('vehicle_number'),
                    vehicle_info.get('chassis_number')
                )
                if existing_vehicle:
                    # Link vehicle to customer
                    await db.vehicles.update_one(
                        {"id": existing_vehicle['id']},
                        {"$set": {"customer_id": customer.id}}
                    )
                    import_stats['vehicles_linked'] += 1
            
            # Create a sales record if sales information is provided
            if sales_info and any(sales_info.values()) and sales_info.get('amount'):
                try:
                    # Parse sale date
                    sale_date = None
                    if sales_info.get('sale_date'):
                        try:
                            # Try to parse various date formats
                            date_str = str(sales_info['sale_date']).strip()
                            from datetime import datetime
                            import re
                            
                            # Handle Excel numeric date format (days since 1900-01-01)
                            if date_str.replace('.', '').isdigit():
                                try:
                                    # Excel date: number of days since 1900-01-01
                                    excel_date = float(date_str)
                                    # Excel incorrectly treats 1900 as a leap year, adjust for dates after Feb 28, 1900
                                    if excel_date > 60:
                                        excel_date -= 1
                                    sale_date = datetime(1900, 1, 1) + timedelta(days=excel_date - 2)
                                except:
                                    pass
                            
                            # Try various string date formats
                            if not sale_date:
                                # Format: DD-MMM (03-Mar) - add current year
                                if re.match(r'\d{1,2}-[A-Za-z]{3}', date_str):
                                    date_str = f"{date_str}-{datetime.now().year}"
                                    sale_date = datetime.strptime(date_str, "%d-%b-%Y")
                                # Format: DD/MM/YYYY (15/01/2024)
                                elif re.match(r'\d{1,2}/\d{1,2}/\d{4}', date_str):
                                    sale_date = datetime.strptime(date_str, "%d/%m/%Y")
                                # Format: DD-MM-YYYY (15-01-2024)
                                elif re.match(r'\d{1,2}-\d{1,2}-\d{4}', date_str):
                                    sale_date = datetime.strptime(date_str, "%d-%m-%Y")
                                # Format: YYYY-MM-DD (2024-01-15)
                                elif re.match(r'\d{4}-\d{1,2}-\d{1,2}', date_str):
                                    sale_date = datetime.strptime(date_str, "%Y-%m-%d")
                                # Format: YYYY/MM/DD (2024/01/15)
                                elif re.match(r'\d{4}/\d{1,2}/\d{1,2}', date_str):
                                    sale_date = datetime.strptime(date_str, "%Y/%m/%d")
                                # Format: DD MMM YYYY (15 Jan 2024)
                                elif re.match(r'\d{1,2}\s+[A-Za-z]{3}\s+\d{4}', date_str):
                                    sale_date = datetime.strptime(date_str, "%d %b %Y")
                                # Format: MMM DD, YYYY (Jan 15, 2024)
                                elif re.match(r'[A-Za-z]{3}\s+\d{1,2},?\s+\d{4}', date_str):
                                    sale_date = datetime.strptime(date_str.replace(',', ''), "%b %d %Y")
                                else:
                                    # Try generic parser as last resort
                                    from dateutil import parser
                                    sale_date = parser.parse(date_str)
                            
                            if not sale_date:
                                sale_date = datetime.now()  # Default to current date
                        except Exception as date_error:
                            print(f"Date parsing error for '{sales_info.get('sale_date')}': {date_error}")
                            sale_date = datetime.now()  # Default if parsing fails
                    else:
                        sale_date = datetime.now()
                    
                    # Create sales record from imported data
                    sale_record = Sale(
                        customer_id=customer.id,
                        vehicle_id=None,  # Will be set if vehicle exists
                        amount=float(sales_info['amount']) if sales_info.get('amount') else 0.0,
                        payment_method=sales_info.get('payment_method', 'CASH').upper(),
                        hypothecation=sales_info.get('hypothecation', ''),
                        sale_date=sale_date,
                        invoice_number=sales_info.get('invoice_number', f"IMP-{customer.id[:8]}"),
                        vehicle_brand=vehicle_info.get('brand', ''),
                        vehicle_model=vehicle_info.get('model', ''),
                        vehicle_color=vehicle_info.get('color', ''),
                        vehicle_chassis=vehicle_info.get('chassis_number', ''),
                        vehicle_engine=vehicle_info.get('engine_number', ''),
                        vehicle_registration=vehicle_info.get('vehicle_number', ''),
                        insurance_nominee=insurance_info.get('nominee_name', ''),
                        insurance_relation=insurance_info.get('relation', ''),
                        insurance_age=insurance_info.get('age', ''),
                        source="import",  # Mark as imported data
                        created_by="import_system"  # Add required created_by field
                    )
                    
                    # Try to find matching vehicle in inventory
                    if vehicle_info.get('chassis_number'):
                        existing_vehicle = await db.vehicles.find_one({
                            "chassis_number": vehicle_info['chassis_number']
                        })
                        if existing_vehicle:
                            sale_record.vehicle_id = existing_vehicle['id']
                            # Update vehicle status to sold
                            await db.vehicles.update_one(
                                {"id": existing_vehicle['id']},
                                {"$set": {"status": "sold", "customer_id": customer.id}}
                            )
                    
                    await db.sales.insert_one(sale_record.dict())
                    import_stats['sales_created'] += 1
                    
                except Exception as sale_error:
                    # Log the error but don't fail the customer import
                    print(f"Warning: Could not create sale record for customer {customer.id}: {sale_error}")
            
            # Track incomplete records
            missing_fields = []
            if not vehicle_info or not any(vehicle_info.values()):
                missing_fields.append('vehicle_info')
            if not insurance_info or not any(insurance_info.values()):
                missing_fields.append('insurance_info')
            if not sales_info or not any(sales_info.values()):
                missing_fields.append('sales_info')
            
            if missing_fields:
                incomplete_records.append({
                    "record_id": customer.id,
                    "row": idx + 2,
                    "missing_fields": missing_fields,
                    "data": row
                })
            
            successful += 1
            
        except Exception as e:
            failed += 1
            errors.append({
                "row": idx + 2,  # +2 because CSV has header and is 1-indexed
                "data": row,
                "error": str(e)
            })
    
    import_job.successful_records = successful
    import_job.failed_records = failed
    import_job.skipped_records = skipped
    import_job.processed_records = successful + failed + skipped
    import_job.errors = errors
    import_job.cross_reference_stats = import_stats
    import_job.incomplete_records = incomplete_records
    
    return ImportResult(
        job_id=import_job.id,
        status="completed",
        message=f"Import completed: {successful} successful, {failed} failed, {skipped} skipped (duplicates). Cross-referenced: {import_stats['vehicles_linked']} vehicles linked, {import_stats['sales_created']} sales created.",
        total_records=len(data),
        successful_records=successful,
        failed_records=failed,
        skipped_records=skipped,
        errors=errors,
        cross_reference_stats=import_stats,
        incomplete_records=incomplete_records
    )

async def import_vehicles_data(data: List[Dict], import_job: ImportJob, user_id: str) -> ImportResult:
    """Import vehicles data with cross-referencing support"""
    successful = 0
    failed = 0
    skipped = 0
    errors = []
    incomplete_records = []
    import_stats = {
        'customers_linked': 0,
        'customers_created': 0,
        'sales_created': 0
    }
    
    valid_brands = ["TVS", "BAJAJ", "HERO", "HONDA", "TRIUMPH", "KTM", "SUZUKI", "APRILIA", "YAMAHA", "PIAGGIO", "ROYAL ENFIELD"]
    
    for idx, row in enumerate(data):
        try:
            # Get fields with fallback values - use safe_str to handle float/NaN values
            brand = safe_str(row.get('brand', '')).upper() or 'UNKNOWN'
            if brand != 'UNKNOWN' and brand not in valid_brands:
                brand = 'UNKNOWN'
            
            # Support both old and new field names for backward compatibility
            chassis_number = (safe_str(row.get('chassis_number', '')) or 
                            safe_str(row.get('chassis_no', '')))
            engine_number = (safe_str(row.get('engine_number', '')) or 
                           safe_str(row.get('engine_no', '')))
            key_number = (safe_str(row.get('key_number', '')) or 
                        safe_str(row.get('key_no', '')))
            vehicle_number = safe_str(row.get('vehicle_number', ''))
            
            # Handle status field with validation
            status = safe_str(row.get('status', '')).lower()
            valid_statuses = ['available', 'in_stock', 'sold', 'returned']
            if status not in valid_statuses:
                status = 'available'
            
            # Check for duplicate chassis number before inserting
            if chassis_number and chassis_number != 'Unknown Chassis':
                existing_vehicle = await db.vehicles.find_one({"chassis_number": chassis_number})
                if existing_vehicle:
                    # Skip duplicate vehicle (don't count as error)
                    skipped += 1
                    continue
            
            vehicle_data = VehicleCreate(
                brand=brand,
                model=safe_str(row.get('model', '')) or 'Unknown Model',
                chassis_number=chassis_number or 'Unknown Chassis',
                engine_number=engine_number or 'Unknown Engine',
                color=safe_str(row.get('color', '')) or 'Unknown Color',
                vehicle_number=vehicle_number or None,
                key_number=key_number or 'Unknown Key',
                inbound_location=safe_str(row.get('inbound_location', '')) or 'Unknown Location',
                page_number=safe_str(row.get('page_number', '')) or None
            )
            
            # Create vehicle with proper status
            vehicle_dict = vehicle_data.dict()
            vehicle_dict['status'] = status
            
            # Handle date_received field
            date_received_str = safe_str(row.get('date_received', ''))
            if date_received_str:
                try:
                    # Try to parse the date in various formats
                    date_received = parse_date_flexible(date_received_str)
                    vehicle_dict['date_received'] = date_received
                except Exception as e:
                    # If date parsing fails, use current date
                    vehicle_dict['date_received'] = datetime.now(timezone.utc)
            else:
                vehicle_dict['date_received'] = datetime.now(timezone.utc)
            
            vehicle = Vehicle(**vehicle_dict)
            
            # CROSS-REFERENCE: Check if customer mobile is provided
            customer_mobile = safe_str(row.get('customer_mobile', ''))
            customer_name = safe_str(row.get('customer_name', ''))
            customer_id = None
            
            if customer_mobile:
                # Find or create customer
                customer_id = await find_or_create_customer(
                    customer_mobile, 
                    {'name': customer_name or 'Unknown Customer'}, 
                    import_stats
                )
                vehicle.customer_id = customer_id
            
            await db.vehicles.insert_one(vehicle.dict())
            
            # CROSS-REFERENCE: Create sales record if sale data is provided
            sale_amount = safe_str(row.get('sale_amount', ''))
            payment_method = safe_str(row.get('payment_method', ''))
            
            if sale_amount and customer_id:
                try:
                    sale_record = Sale(
                        customer_id=customer_id,
                        vehicle_id=vehicle.id,
                        amount=float(sale_amount),
                        payment_method=payment_method.upper() or 'CASH',
                        sale_date=datetime.now(timezone.utc),
                        invoice_number=f"IMP-VEH-{vehicle.id[:8]}",
                        vehicle_brand=brand,
                        vehicle_model=vehicle_data.model,
                        vehicle_color=vehicle_data.color,
                        vehicle_chassis=chassis_number,
                        vehicle_engine=engine_number,
                        vehicle_registration=vehicle_number,
                        source="import",
                        created_by=user_id
                    )
                    await db.sales.insert_one(sale_record.dict())
                    import_stats['sales_created'] += 1
                    
                    # Update vehicle status to sold if sale is created
                    await db.vehicles.update_one(
                        {"id": vehicle.id},
                        {"$set": {"status": "sold"}}
                    )
                except Exception as sale_error:
                    print(f"Warning: Could not create sale record for vehicle {vehicle.id}: {sale_error}")
            
            # Track incomplete records (vehicles without customer linkage)
            if not customer_id and customer_mobile:
                incomplete_records.append({
                    "record_id": vehicle.id,
                    "row": idx + 2,
                    "missing_fields": ["customer_details"],
                    "data": row
                })
            
            successful += 1
            
        except Exception as e:
            failed += 1
            errors.append({
                "row": idx + 2,
                "data": row,
                "error": str(e)
            })
    
    import_job.successful_records = successful
    import_job.failed_records = failed
    import_job.skipped_records = skipped
    import_job.processed_records = successful + failed + skipped
    import_job.errors = errors
    import_job.cross_reference_stats = import_stats
    import_job.incomplete_records = incomplete_records
    
    return ImportResult(
        job_id=import_job.id,
        status="completed",
        message=f"Import completed: {successful} successful, {failed} failed, {skipped} skipped (duplicates). Cross-referenced: {import_stats['customers_linked']} customers linked, {import_stats['customers_created']} customers created, {import_stats['sales_created']} sales created.",
        total_records=len(data),
        successful_records=successful,
        failed_records=failed,
        skipped_records=skipped,
        errors=errors,
        cross_reference_stats=import_stats,
        incomplete_records=incomplete_records
    )

async def import_spare_parts_data(data: List[Dict], import_job: ImportJob, user_id: str) -> ImportResult:
    """Import spare parts data"""
    successful = 0
    failed = 0
    skipped = 0
    errors = []
    
    for idx, row in enumerate(data):
        try:
            # Validate required fields
            required_fields = ['name', 'part_number', 'brand', 'quantity', 'unit_price']
            for field in required_fields:
                if not row.get(field):
                    raise ValueError(f"{field} is required")
            
            part_number = row['part_number'].strip()
            
            # Check for duplicate spare part by part_number
            existing_part = await db.spare_parts.find_one({"part_number": part_number})
            if existing_part:
                # Skip duplicate spare part
                skipped += 1
                continue
            
            spare_part_data = SparePartCreate(
                name=row['name'].strip(),
                part_number=part_number,
                brand=row['brand'].strip(),
                quantity=int(row['quantity']),
                unit=row.get('unit', 'Nos').strip(),
                unit_price=float(row['unit_price']),
                hsn_sac=row.get('hsn_sac', '').strip() or None,
                gst_percentage=float(row.get('gst_percentage', 18.0)),
                compatible_models=row.get('compatible_models', '').strip() or None,
                low_stock_threshold=int(row.get('low_stock_threshold', 5)),
                supplier=row.get('supplier', '').strip() or None
            )
            
            spare_part = SparePart(**spare_part_data.dict())
            await db.spare_parts.insert_one(spare_part.dict())
            successful += 1
            
        except Exception as e:
            failed += 1
            errors.append({
                "row": idx + 2,
                "data": row,
                "error": str(e)
            })
    
    import_job.successful_records = successful
    import_job.failed_records = failed
    import_job.skipped_records = skipped
    import_job.processed_records = successful + failed + skipped
    import_job.errors = errors
    
    return ImportResult(
        job_id=import_job.id,
        status="completed",
        message=f"Import completed: {successful} successful, {failed} failed, {skipped} skipped (duplicates)",
        total_records=len(data),
        successful_records=successful,
        failed_records=failed,
        skipped_records=skipped,
        errors=errors
    )

async def import_services_data(data: List[Dict], import_job: ImportJob, user_id: str) -> ImportResult:
    """Import services data with cross-referencing support"""
    successful = 0
    failed = 0
    skipped = 0
    errors = []
    incomplete_records = []
    import_stats = {
        'customers_linked': 0,
        'customers_created': 0,
        'vehicles_linked': 0
    }
    
    for idx, row in enumerate(data):
        try:
            # Validate required fields (relaxed - only need mobile or vehicle identifier)
            customer_mobile = (row.get('customer_mobile') or '').strip()
            customer_name = (row.get('customer_name') or '').strip()
            vehicle_number = (row.get('vehicle_number') or '').strip()
            chassis_number = (row.get('chassis_number') or '').strip()
            service_type = (row.get('service_type') or 'general_service').strip()
            amount = float(row.get('amount', 0) or 0)
            
            if not customer_mobile and not vehicle_number and not chassis_number:
                raise ValueError("Either customer_mobile or vehicle identifiers (vehicle_number/chassis_number) must be provided")
            
            # CROSS-REFERENCE: Find or create customer
            customer_id = None
            if customer_mobile:
                customer_id = await find_or_create_customer(
                    customer_mobile,
                    {'name': customer_name or 'Unknown Customer'},
                    import_stats
                )
            
            # CROSS-REFERENCE: Find vehicle by identifiers
            vehicle_id = None
            vehicle_brand = None
            vehicle_model = None
            vehicle_year = None
            
            if vehicle_number or chassis_number:
                vehicle = await find_vehicle_by_identifiers(vehicle_number, chassis_number)
                if vehicle:
                    vehicle_id = vehicle.get('id')
                    vehicle_number = vehicle.get('vehicle_number', vehicle_number)
                    vehicle_brand = vehicle.get('brand')
                    vehicle_model = vehicle.get('model')
                    vehicle_year = vehicle.get('year')
                    import_stats['vehicles_linked'] += 1
                    
                    # If no customer was found by mobile, try to get from vehicle
                    if not customer_id and vehicle.get('customer_id'):
                        customer_id = vehicle.get('customer_id')
                        import_stats['customers_linked'] += 1
            
            # If vehicle not found in database, use CSV-provided vehicle details
            if not vehicle_brand:
                vehicle_brand = (row.get('vehicle_brand') or '').strip() or None
            if not vehicle_model:
                vehicle_model = (row.get('vehicle_model') or '').strip() or None
            if not vehicle_year:
                vehicle_year = (row.get('vehicle_year') or '').strip() or None
            
            # If still no customer, create a placeholder
            if not customer_id:
                customer_id = await find_or_create_customer(
                    f"AUTO-{str(uuid.uuid4())[:8]}",
                    {'name': customer_name or 'Unknown Customer'},
                    import_stats
                )
                incomplete_records.append({
                    "row": idx + 2,
                    "missing_fields": ["customer_mobile"],
                    "data": row
                })
            
            # Check for duplicate service (same customer, vehicle, service_type, and similar amount)
            duplicate_check = {
                "customer_id": customer_id,
                "vehicle_number": vehicle_number or chassis_number or 'Unknown',
                "service_type": service_type,
                "amount": amount
            }
            existing_service = await db.services.find_one(duplicate_check)
            if existing_service:
                # Skip duplicate service
                skipped += 1
                continue
            
            service_data = ServiceCreate(
                customer_id=customer_id,
                vehicle_id=vehicle_id,
                vehicle_number=vehicle_number or chassis_number or 'Unknown',
                service_type=service_type,
                description=(row.get('description') or '').strip() or 'Imported service',
                amount=amount
            )
            
            # Generate job card number
            count = await db.services.count_documents({})
            job_card_number = f"JOB-{count + 1:06d}"
            
            service_dict = service_data.dict()
            service_dict['job_card_number'] = job_card_number
            service_dict['created_by'] = user_id
            
            # Handle registration_date (service_date)
            registration_date = (row.get('registration_date') or '').strip()
            if registration_date:
                try:
                    from dateutil import parser as date_parser
                    parsed_date = date_parser.parse(registration_date)
                    service_dict['service_date'] = parsed_date
                except Exception:
                    # If parsing fails, use current datetime
                    service_dict['service_date'] = datetime.now(timezone.utc)
            
            # Add vehicle details for imported services (so they can be displayed even if vehicle is deleted)
            if vehicle_brand:
                service_dict['vehicle_brand'] = vehicle_brand
            if vehicle_model:
                service_dict['vehicle_model'] = vehicle_model
            if vehicle_year:
                service_dict['vehicle_year'] = vehicle_year
            
            service = Service(**service_dict)
            
            await db.services.insert_one(service.dict())
            successful += 1
            
        except Exception as e:
            failed += 1
            errors.append({
                "row": idx + 2,
                "data": row,
                "error": str(e)
            })
    
    import_job.successful_records = successful
    import_job.failed_records = failed
    import_job.skipped_records = skipped
    import_job.processed_records = successful + failed + skipped
    import_job.errors = errors
    import_job.cross_reference_stats = import_stats
    import_job.incomplete_records = incomplete_records
    
    return ImportResult(
        job_id=import_job.id,
        status="completed",
        message=f"Import completed: {successful} successful, {failed} failed, {skipped} skipped (duplicates). Cross-referenced: {import_stats['customers_linked']} customers linked, {import_stats['customers_created']} customers created, {import_stats['vehicles_linked']} vehicles linked.",
        total_records=len(data),
        successful_records=successful,
        failed_records=failed,
        skipped_records=skipped,
        errors=errors,
        cross_reference_stats=import_stats,
        incomplete_records=incomplete_records
    )
