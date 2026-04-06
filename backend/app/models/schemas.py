from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    STAFF = "staff"

class VehicleStatus(str, Enum):
    IN_STOCK = "in_stock"
    SOLD = "sold"
    RETURNED = "returned"

class ServiceStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    role: UserRole
    full_name: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole
    full_name: str

class UserLogin(BaseModel):
    username: str
    password: str

class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: Optional[str] = None
    care_of: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    vehicle_info: Optional[Dict[str, Any]] = None
    insurance_info: Optional[Dict[str, Any]] = None
    sales_info: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    name: Optional[str] = None
    care_of: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    vehicle_info: Optional[Dict[str, Any]] = None
    insurance_info: Optional[Dict[str, Any]] = None
    sales_info: Optional[Dict[str, Any]] = None

class Vehicle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    brand: Optional[str] = None  # TVS, BAJAJ, HERO, HONDA, TRIUMPH, KTM, SUZUKI, APRILIA, YAMAHA, PIAGGIO, ROYAL ENFIELD
    model: Optional[str] = None
    chassis_number: Optional[str] = None  # Standardized from chassis_no
    engine_number: Optional[str] = None  # Standardized from engine_no
    color: Optional[str] = None
    vehicle_number: Optional[str] = None  # Registration number
    key_number: Optional[str] = None  # Standardized from key_no
    inbound_location: Optional[str] = None
    outbound_location: Optional[str] = None
    status: VehicleStatus = VehicleStatus.IN_STOCK
    page_number: Optional[str] = None
    date_received: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    date_sold: Optional[datetime] = None
    date_returned: Optional[datetime] = None
    customer_id: Optional[str] = None

class VehicleCreate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    chassis_number: Optional[str] = None  # Standardized from chassis_no
    engine_number: Optional[str] = None  # Standardized from engine_no
    color: Optional[str] = None
    vehicle_number: Optional[str] = None  # Registration number
    key_number: Optional[str] = None  # Standardized from key_no
    inbound_location: Optional[str] = None
    page_number: Optional[str] = None
    date_received: Optional[datetime] = None

class VehicleUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    chassis_number: Optional[str] = None
    engine_number: Optional[str] = None
    color: Optional[str] = None
    vehicle_number: Optional[str] = None
    key_number: Optional[str] = None
    inbound_location: Optional[str] = None
    page_number: Optional[str] = None
    outbound_location: Optional[str] = None
    status: Optional[str] = None
    date_received: Optional[datetime] = None
    date_returned: Optional[str] = None

class Sale(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    customer_id: str
    vehicle_id: Optional[str] = None  # Made optional for imported sales without specific vehicles
    sale_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    amount: float
    payment_method: str
    insurance_details: Optional[Dict[str, Any]] = None
    created_by: str
    source: str = "direct"  # "direct" for manual sales, "import" for imported data
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Additional fields for imported sales data (not in create model)
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_color: Optional[str] = None
    vehicle_chassis: Optional[str] = None
    vehicle_engine: Optional[str] = None
    vehicle_registration: Optional[str] = None
    insurance_nominee: Optional[str] = None
    insurance_relation: Optional[str] = None
    insurance_age: Optional[str] = None
    hypothecation: Optional[str] = None

class SaleCreate(BaseModel):
    customer_id: str
    vehicle_id: Optional[str] = None  # Made optional for imported sales
    sale_date: Optional[datetime] = None  # Allow updating sale date
    amount: float
    payment_method: str
    insurance_details: Optional[Dict[str, Any]] = None
    source: str = "direct"  # Default to direct sales
    
    # Additional fields for imported sales and editing
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_color: Optional[str] = None
    vehicle_chassis: Optional[str] = None
    vehicle_engine: Optional[str] = None
    vehicle_registration: Optional[str] = None
    insurance_nominee: Optional[str] = None
    insurance_relation: Optional[str] = None
    insurance_age: Optional[str] = None
    hypothecation: Optional[str] = None

class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_card_number: str
    customer_id: str
    vehicle_id: Optional[str] = None
    vehicle_number: str  # Registration number (standardized)
    vehicle_brand: Optional[str] = None  # For imported services without vehicle_id
    vehicle_model: Optional[str] = None  # For imported services without vehicle_id
    vehicle_year: Optional[str] = None  # For imported services without vehicle_id
    service_type: str
    description: str
    status: ServiceStatus = ServiceStatus.PENDING
    service_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completion_date: Optional[datetime] = None
    amount: float
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_registration: bool = False  # Flag to identify registration vs job card
    service_number: Optional[str] = None  # User-defined service number
    kms_driven: Optional[int] = None  # Kilometers driven at time of service

# Customer + Vehicle Registration Model (One-time registration)
class Registration(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    registration_number: str  # REG-000001
    customer_id: str
    customer_name: str
    customer_mobile: str
    customer_address: Optional[str] = None
    vehicle_number: str
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[str] = None
    chassis_number: Optional[str] = None
    engine_number: Optional[str] = None
    registration_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RegistrationCreate(BaseModel):
    customer_name: str
    customer_mobile: str
    customer_address: Optional[str] = None
    vehicle_number: str
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[str] = None
    chassis_number: Optional[str] = None
    engine_number: Optional[str] = None

class ServiceCreate(BaseModel):
    customer_id: str
    vehicle_id: Optional[str] = None
    vehicle_number: str  # Registration number (standardized)
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[str] = None
    service_type: str
    description: str
    amount: float
    service_number: Optional[str] = None
    kms_driven: Optional[int] = None
    service_date: Optional[datetime] = None  # Service date (defaults to now if not provided)

class ServiceUpdate(BaseModel):
    customer_id: str
    vehicle_id: Optional[str] = None
    vehicle_number: str  # Registration number (standardized)
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[str] = None
    service_type: str
    description: str
    amount: float
    service_date: Optional[datetime] = None  # Registration date
    service_number: Optional[str] = None
    kms_driven: Optional[int] = None

class SparePart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    part_number: str
    brand: str
    quantity: int
    unit: str = "Nos"  # Unit of measurement (Nos, Kg, Ltr, etc.)
    unit_price: float
    hsn_sac: Optional[str] = None  # HSN/SAC code
    gst_percentage: float = 18.0  # GST percentage
    compatible_models: Optional[str] = None  # Compatible vehicle models
    low_stock_threshold: int = 5
    supplier: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SparePartCreate(BaseModel):
    name: str
    part_number: str
    brand: str
    quantity: int
    unit: str = "Nos"
    unit_price: float
    hsn_sac: Optional[str] = None
    gst_percentage: float = 18.0
    compatible_models: Optional[str] = None
    low_stock_threshold: int = 5
    supplier: Optional[str] = None

class SparePartBill(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bill_number: str
    customer_id: Optional[str] = None  # For backwards compatibility
    customer_data: Optional[Dict[str, str]] = None  # {name, mobile, vehicle_name, vehicle_number}
    items: List[Dict[str, Any]]  # Detailed GST items with all calculations
    subtotal: float
    total_discount: float
    total_cgst: float
    total_sgst: float
    total_tax: float
    total_amount: float
    bill_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SparePartBillCreate(BaseModel):
    customer_data: Optional[Dict[str, str]] = None  # {name, mobile, vehicle_name, vehicle_number}
    customer_id: Optional[str] = None  # For backwards compatibility
    items: List[Dict[str, Any]]
    subtotal: Optional[float] = 0
    total_discount: Optional[float] = 0
    total_cgst: Optional[float] = 0
    total_sgst: Optional[float] = 0
    total_tax: Optional[float] = 0
    total_amount: Optional[float] = 0

# Service Bill Models
class ServiceBill(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bill_number: str
    job_card_number: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_mobile: Optional[str] = None
    vehicle_number: Optional[str] = None
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    items: List[Dict[str, Any]]  # Itemized bill items with GST calculations
    subtotal: float = 0
    total_discount: float = 0
    total_cgst: float = 0
    total_sgst: float = 0
    total_tax: float = 0
    total_amount: float = 0
    bill_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending"
    created_by: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceBillCreate(BaseModel):
    bill_number: str
    job_card_number: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_mobile: Optional[str] = None
    vehicle_number: Optional[str] = None
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    items: List[Dict[str, Any]]
    subtotal: float = 0
    total_discount: float = 0
    total_cgst: float = 0
    total_sgst: float = 0
    total_tax: float = 0
    total_amount: float = 0
    bill_date: Optional[str] = None
    status: str = "pending"

# Backup Models
class BackupConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    backup_enabled: bool = True
    backup_time: str = "02:00"  # 24-hour format
    retention_days: int = 30
    compress_backups: bool = True
    email_notifications: bool = False
    email_recipients: List[str] = []
    backup_location: str = "./backups"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BackupJob(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str  # running, completed, failed
    start_time: datetime
    end_time: Optional[datetime] = None
    total_records: int = 0
    backup_size_mb: float = 0
    backup_file_path: str = ""
    error_message: Optional[str] = None
    records_backed_up: Dict[str, int] = {}
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BackupJobCreate(BaseModel):
    backup_type: str = "manual"  # manual or scheduled
    export_format: str = "json"  # json, excel

class BackupStats(BaseModel):
    total_backups: int
    successful_backups: int
    failed_backups: int
    last_backup_date: Optional[datetime]
    total_storage_used_mb: float
    oldest_backup_date: Optional[datetime]

# Import Models
class ImportJob(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    file_name: str
    data_type: str  # customers, vehicles, spare_parts, services
    status: str  # processing, completed, failed
    total_records: int = 0
    processed_records: int = 0
    successful_records: int = 0
    failed_records: int = 0
    skipped_records: int = 0  # Records skipped due to duplicates
    errors: List[Dict[str, Any]] = []
    cross_reference_stats: Optional[Dict[str, int]] = {}  # Track linking statistics
    incomplete_records: List[Dict[str, Any]] = []  # Records with missing data
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ImportResult(BaseModel):
    job_id: str
    status: str
    message: str
    total_records: int = 0
    successful_records: int = 0
    failed_records: int = 0
    skipped_records: int = 0  # Records skipped due to duplicates
    errors: List[Dict[str, Any]] = []
    cross_reference_stats: Optional[Dict[str, int]] = {}  # Linking statistics
    incomplete_records: List[Dict[str, Any]] = []  # Records needing completion

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