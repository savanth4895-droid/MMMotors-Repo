import asyncio
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends

from app.core.database import db
from app.models.schemas import User, VehicleStatus, ServiceStatus
from app.api.dependencies import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """Aggregate dashboard statistics — parallelized with asyncio.gather."""

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end   = datetime.now(timezone.utc).replace(hour=23, minute=59, second=59, microsecond=999999)

    sales_pipeline = [
        {"$group": {
            "_id": None,
            "total_revenue":    {"$sum": "$amount"},
            "direct_revenue":   {"$sum": {"$cond": [
                {"$or": [{"$not": ["$source"]}, {"$eq": ["$source", "direct"]}]},
                "$amount", 0
            ]}},
            "imported_revenue": {"$sum": {"$cond": [
                {"$eq": ["$source", "import"]},
                "$amount", 0
            ]}}
        }}
    ]

    (
        total_customers,
        total_vehicles,
        vehicles_in_stock,
        vehicles_sold,
        pending_services,
        low_stock_parts,
        completed_today,
        total_sales,
        direct_sales,
        imported_sales,
        revenue_stats,
    ) = await asyncio.gather(
        db.customers.count_documents({}),
        db.vehicles.count_documents({}),
        db.vehicles.count_documents({"status": VehicleStatus.IN_STOCK}),
        db.vehicles.count_documents({"status": VehicleStatus.SOLD}),
        db.services.count_documents({"status": ServiceStatus.PENDING}),
        db.spare_parts.count_documents({"$expr": {"$lte": ["$quantity", "$low_stock_threshold"]}}),
        db.services.count_documents({
            "status": ServiceStatus.COMPLETED,
            "updated_at": {"$gte": today_start, "$lte": today_end}
        }),
        db.sales.count_documents({}),
        db.sales.count_documents({"$or": [{"source": {"$exists": False}}, {"source": "direct"}]}),
        db.sales.count_documents({"source": "import"}),
        db.sales.aggregate(sales_pipeline).to_list(1),
    )

    total_revenue    = revenue_stats[0]["total_revenue"]    if revenue_stats else 0
    direct_revenue   = revenue_stats[0]["direct_revenue"]   if revenue_stats else 0
    imported_revenue = revenue_stats[0]["imported_revenue"] if revenue_stats else 0

    return {
        "total_customers":   total_customers,
        "total_vehicles":    total_vehicles,
        "vehicles_in_stock": vehicles_in_stock,
        "vehicles_sold":     vehicles_sold,
        "pending_services":  pending_services,
        "completed_today":   completed_today,
        "low_stock_parts":   low_stock_parts,
        "sales_stats": {
            "total_sales":       total_sales,
            "direct_sales":      direct_sales,
            "imported_sales":    imported_sales,
            "total_revenue":     total_revenue,
            "direct_revenue":    direct_revenue,
            "imported_revenue":  imported_revenue,
        }
    }
