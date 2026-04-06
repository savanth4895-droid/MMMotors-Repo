# M M Motors - Unified Data Schema

## 1. Customer Fields
```
- id: string (UUID)
- name: string 
- care_of: string (optional)
- mobile: string (primary contact)
- email: string (optional)
- address: string (optional)
- created_at: datetime
- updated_at: datetime
```

## 2. Vehicle Fields
```
- id: string (UUID)
- brand: string (TVS, BAJAJ, HERO, HONDA, etc.)
- model: string
- chassis_number: string (standardized from chassis_no)
- engine_number: string (standardized from engine_no) 
- color: string
- vehicle_number: string (registration number - standardized from vehicle_no)
- key_number: string (standardized from key_no)
- inbound_location: string
- page_number: string
- status: string (available, sold, reserved)
- date_received: datetime
- created_at: datetime
```

## 3. Vehicle Info (embedded in customer records)
```
- brand: string
- model: string
- color: string
- vehicle_number: string (registration number)
- chassis_number: string
- engine_number: string
```

## 4. Insurance Info (embedded in customer records)
```
- nominee_name: string
- relation: string
- age: string
```

## 5. Sales Info (embedded in customer records)
```
- amount: string
- payment_method: string (CASH, UPI, CARD, Bank Transfer)
- hypothecation: string
- sale_date: string
- invoice_number: string
```

## 6. Service Fields
```
- id: string (UUID)
- customer_id: string
- vehicle_id: string (optional)
- vehicle_number: string (registration number)
- job_card_number: string
- service_type: string
- description: string
- amount: float
- status: string (pending, in_progress, completed)
- created_at: datetime
- completion_date: datetime (optional)
```

## 7. CSV Import/Export Template Fields

### Customer Template:
```
name,care_of,mobile,email,address,brand,model,color,vehicle_number,chassis_number,engine_number,nominee_name,relation,age,sale_amount,payment_method,hypothecation,sale_date,invoice_number
```

### Vehicle Template:
```
brand,model,chassis_number,engine_number,color,key_number,inbound_location,page_number
```

## 8. Field Standardization Rules

1. **Always use `mobile` instead of `phone`**
2. **Always use `vehicle_number` instead of `vehicle_no` or `vehicle_reg_no`**  
3. **Always use `chassis_number` instead of `chassis_no`**
4. **Always use `engine_number` instead of `engine_no`**
5. **Always use `key_number` instead of `key_no`**
6. **Insurance fields: `nominee_name`, `relation`, `age`**
7. **Date fields should be consistent datetime format**

## 9. Database Collection Standards

### customers
```json
{
  "id": "uuid",
  "name": "Customer Name",
  "care_of": "S/O Father Name", 
  "mobile": "9876543210",
  "email": "email@domain.com",
  "address": "Full Address",
  "vehicle_info": {
    "brand": "TVS",
    "model": "Apache RTR 160",
    "color": "Red", 
    "vehicle_number": "KA01AB1234",
    "chassis_number": "ABC123456789012345",
    "engine_number": "ENG987654321"
  },
  "insurance_info": {
    "nominee_name": "Nominee Name",
    "relation": "Wife",
    "age": "28"
  },
  "sales_info": {
    "amount": "75000",
    "payment_method": "CASH",
    "hypothecation": "Bank Finance",
    "sale_date": "2024-01-15",
    "invoice_number": "INV001"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### vehicles
```json
{
  "id": "uuid",
  "brand": "TVS",
  "model": "Apache RTR 160", 
  "chassis_number": "ABC123456789012345",
  "engine_number": "ENG987654321",
  "color": "Red",
  "vehicle_number": "KA01AB1234",
  "key_number": "KEY001", 
  "inbound_location": "Warehouse A",
  "page_number": "1",
  "status": "available",
  "date_received": "2024-01-01T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### services  
```json
{
  "id": "uuid",
  "customer_id": "customer-uuid",
  "vehicle_id": "vehicle-uuid",
  "vehicle_number": "KA01AB1234",
  "job_card_number": "JOB-000001",
  "service_type": "regular_service",
  "description": "Regular maintenance",
  "amount": 500.0,
  "status": "completed",
  "created_at": "2024-01-01T00:00:00Z",
  "completion_date": "2024-01-01T00:00:00Z"
}
```