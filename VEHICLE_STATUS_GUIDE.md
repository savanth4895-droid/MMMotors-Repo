# Vehicle Status Column - Import Guide

## Overview
The vehicles CSV import template includes a **status** column that allows you to set the current status of each vehicle during import.

## Status Column Location
The status column is the **10th column** in the vehicles CSV template, positioned between `page_number` and `customer_mobile`:

```
brand,model,chassis_number,engine_number,color,vehicle_number,key_number,inbound_location,page_number,status,customer_mobile,customer_name,sale_amount,payment_method
```

## Valid Status Values

| Status Value | Description | Use Case |
|-------------|-------------|----------|
| `available` | Vehicle is available for sale | Default status for new vehicles in showroom |
| `in_stock` | Vehicle is in inventory | Vehicles in warehouse/storage |
| `sold` | Vehicle has been sold | Completed sales transactions |
| `returned` | Vehicle has been returned | Returns or exchanges |

## Important Notes

1. **Case Insensitive**: The system accepts status values in any case (e.g., `Available`, `AVAILABLE`, `available`)
2. **Default Value**: If status is not provided or invalid, it defaults to `available`
3. **Auto-Update**: If you provide `sale_amount` in the import, the vehicle status will automatically be updated to `sold`

## Example CSV Rows

### Example 1: Available Vehicle (Default)
```csv
TVS,Apache RTR 160,ABC123456789,ENG987654321,Red,KA01AB1234,KEY001,Warehouse A,Page 1,available,,,
```

### Example 2: Vehicle Already Sold with Customer
```csv
BAJAJ,Pulsar 150,DEF123456789,ENG987654322,Blue,KA02CD5678,KEY002,Warehouse B,Page 2,sold,9876543210,John Doe,65000,cash
```

### Example 3: Vehicle In Stock
```csv
HERO,Splendor Plus,GHI123456789,ENG987654323,Black,KA03MN9012,KEY003,Warehouse A,Page 3,in_stock,,,
```

### Example 4: Returned Vehicle
```csv
HONDA,Activa 6G,JKL123456789,ENG987654324,White,KA04PQ3456,KEY004,Service Center,Page 4,returned,,,
```

## How to Download the Template

1. Navigate to **Data Import** section in the application
2. Select **Vehicles** as the data type
3. Click **"Download Template"** button
4. The downloaded CSV will include the status column with example data

## Workflow with Status

### Scenario 1: Importing New Stock
When importing new vehicles that just arrived:
```csv
brand,model,chassis_number,...,status,...
TVS,Raider 125,NEW123456789,...,available,...
```

### Scenario 2: Importing Historical Sales Data
When importing vehicles that were already sold:
```csv
brand,model,chassis_number,...,status,customer_mobile,customer_name,sale_amount,payment_method
BAJAJ,Pulsar 150,SOLD123456789,...,sold,9876543210,Customer Name,50000,cash
```

### Scenario 3: Bulk Status Update
You can export existing vehicles, update their status column, and re-import (though direct update via the vehicles page is recommended).

## Cross-Reference with Status

The status field works seamlessly with the cross-referencing system:

- **If status = "sold"** and you provide customer/sale data → Sale record is created
- **If status = "available"** → Vehicle is marked as available for new sales
- **If status = "returned"** → Vehicle can be resold with proper tracking

## Troubleshooting

### Issue: Status not updating after import
**Solution**: Check that your status value is one of the four valid values. Invalid values default to `available`.

### Issue: Vehicle showing wrong status
**Solution**: If you provided `sale_amount` in the import, the status is automatically set to `sold` regardless of what you specified.

### Issue: Status column missing in downloaded template
**Solution**: Make sure you're downloading the latest template from the application. The status column is the 10th column in the template.

## API Details

For developers integrating via API:

**Endpoint**: `GET /api/import/template/vehicles`

**Response includes status column with valid example values**

The import endpoint validates status values and applies defaults automatically, ensuring data integrity.
