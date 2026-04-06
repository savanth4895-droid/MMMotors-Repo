# M M Motors - Vehicle Service Management System

## Original Problem Statement
Build a comprehensive vehicle service management application for a motor dealership business. The system manages vehicle inventory, sales, services, and spare parts across multiple vehicle brands.

## Core Features Implemented

### 1. Vehicle Stock Management
- Brand-based inventory organization (TVS, BAJAJ, HERO, HONDA, TRIUMPH, KTM, SUZUKI, APRILIA, YAMAHA, PIAGGIO, ROYAL ENFIELD)
- Add/Edit/Delete vehicles with full details
- Bulk delete with force cascade option
- Date Received tracking and display
- Export data to CSV
- Search and filter capabilities

### 2. Sales Management
- Invoice creation and management
- Customer management
- Payment tracking (cash, finance)
- Invoice editing with real-time UI updates

### 3. Services Module
- Service Registration
- Job Cards with Service Number, KMs Driven, Service Date
- Service Due Schedule with dismissal and base date override
- Service Billing

### 4. Data Import
- Excel/CSV import for vehicles and customers
- Robust data sanitization (safe_str function)
- Flexible date parsing

## Technical Architecture

```
/app/
├── backend/
│   ├── server.py              # FastAPI backend (monolithic)
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sales.js       # ~7000 lines (needs refactoring)
│   │   │   ├── Services.js    # ~7400 lines (needs refactoring)
│   │   │   ├── VehicleStock.js
│   │   │   └── ui/            # Shadcn components
│   │   └── ...
│   └── .env
└── memory/
    └── PRD.md
```

## Key API Endpoints
- `GET/POST/PUT/DELETE /api/vehicles` - Vehicle CRUD
- `POST /api/dismiss-service-due` - Dismiss service due items
- `POST /api/bulk-dismiss-service-due` - Bulk dismiss
- `POST /api/base-date-overrides` - Custom service base dates
- `GET /api/dismissed-service-dues` - Fetch dismissed items
- `POST /api/import/vehicles` - Bulk vehicle import

## Database Collections (MongoDB)
- vehicles
- customers
- sales
- services
- job_cards
- dismissed_service_dues
- base_date_overrides

## Completed Work (Latest Session - Jan 2026)
- ✅ UI bug fix: Invoice list update on edit
- ✅ Job Card enhancements (Service Number, KMs Driven, editable Service Date)
- ✅ Service Due Schedule delete functionality (single/bulk)
- ✅ Editable Base Date for service calculations
- ✅ Data persistence fix for Service Due Schedule
- ✅ Loading states and error handling improvements
- ✅ Backend import crash fix (safe_str function)
- ✅ Added ROYAL ENFIELD brand
- ✅ Date Received field in Add Vehicle form
- ✅ Date Received displayed in Vehicle Stock tables

## Prioritized Backlog

### P0 (Critical)
- None currently

### P1 (High Priority)
- **Refactor Sales.js** - Break down ~7000 line monolithic component
- **Refactor Services.js** - Break down ~7400 line monolithic component

### P2 (Medium Priority)
- Form validation with inline error messages
- Enhanced user feedback for form submissions

### P3 (Low Priority)
- Network retry logic for failed API calls
- Additional export options

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI, Python
- **Database**: MongoDB
- **Libraries**: lodash, lucide-react, axios, sonner

## Authentication
- JWT-based authentication
- Default admin user: admin/admin123

## Notes
- All vehicle stock tables now display date_received in Date column
- Service Due Schedule uses persistent collections for dismissals and date overrides
- Data import handles malformed Excel data gracefully
