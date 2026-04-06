import logging
import os
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from app.core.database import client, db

from app.api.routes import (
    auth,
    customers,
    vehicles,
    sales,
    services,
    spare_parts,
    imports_exports,
    duplicates,
    backup,
    activities,
    dashboard,
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Two Wheeler Business Management API")

@app.on_event("startup")
async def startup_db_client():
    from app.core.config import settings
    try:
        await client.admin.command('ping')
        print(f"✅ Successfully connected to MongoDB Database: {settings.DB_NAME}")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {str(e)}")

    try:
        await db.vehicles.create_index("chassis_number", sparse=True)
        await db.vehicles.create_index("vehicle_number", sparse=True)
        await db.vehicles.create_index("status")
        await db.customers.create_index("mobile", sparse=True)
        await db.services.create_index("job_card_number", sparse=True)
        await db.services.create_index("status")
        await db.sales.create_index("invoice_number", sparse=True)
        await db.sales.create_index("customer_id")
        await db.spare_parts.create_index("part_number", sparse=True)
        await db.activities.create_index([("created_at", -1)])
        # TTL index for login_attempts — auto-expire after 5 minutes (300s)
        await db.login_attempts.create_index("created_at", expireAfterSeconds=300)
        print("✅ MongoDB indexes created")
    except Exception as e:
        print(f"⚠️ Index creation warning: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    print("✅ MongoDB connection closed")

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(customers.router, prefix="/api", tags=["Customers"])
app.include_router(vehicles.router, prefix="/api", tags=["Vehicles"])
app.include_router(sales.router, prefix="/api", tags=["Sales"])
app.include_router(services.router, prefix="/api", tags=["Services"])
app.include_router(spare_parts.router, prefix="/api", tags=["Spare Parts"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(imports_exports.router, prefix="/api", tags=["Imports & Exports"])
app.include_router(duplicates.router, prefix="/api", tags=["Duplicates Check"])
app.include_router(backup.router, prefix="/api", tags=["Backup"])
app.include_router(activities.router, prefix="/api", tags=["Activities"])

# Health checks
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/ready")
async def readiness_check():
    try:
        await db.command("ping")
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail=f"Database not ready: {str(e)}")

@app.get("/api/")
async def root():
    return {"message": "Two Wheeler Business Management API is running"}

# CORS — env var overrides default. Default covers local dev + production.
CORS_ORIGINS = os.environ.get(
    'CORS_ORIGINS',
    'http://localhost:3000,http://localhost:5000,http://127.0.0.1:3000,http://127.0.0.1:5000,'
    'https://mmmotors.online,https://www.mmmotors.online'
).split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
