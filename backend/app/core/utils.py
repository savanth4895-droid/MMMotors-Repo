from app.core.database import db
from app.models.schemas import Activity, ActivityCreate
import re
import math
from datetime import datetime, timedelta, timezone

# ---------------------------------------------------------------------------
# MongoDB-backed rate limiter (survives Render restarts; TTL index auto-cleans)
# TTL index on login_attempts.created_at (expireAfterSeconds=300) is created
# at startup in main.py — no manual cleanup needed.
# ---------------------------------------------------------------------------

class LoginRateLimiter:
    """MongoDB-backed login rate limiter — persists across restarts."""

    def __init__(self, max_attempts: int = 5, window_seconds: int = 300):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds

    def _key_filter(self, key: str) -> dict:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=self.window_seconds)
        return {"username": key, "created_at": {"$gte": cutoff}}

    async def is_rate_limited(self, key: str) -> bool:
        count = await db.login_attempts.count_documents(self._key_filter(key))
        return count >= self.max_attempts

    async def record_attempt(self, key: str):
        await db.login_attempts.insert_one({
            "username": key,
            "created_at": datetime.now(timezone.utc)
        })

    async def reset(self, key: str):
        await db.login_attempts.delete_many({"username": key})


login_limiter = LoginRateLimiter(max_attempts=5, window_seconds=300)


def parse_date_flexible(date_str: str) -> datetime:
    """Parse date from various formats"""
    date_str = date_str.strip()

    try:
        excel_date = float(date_str)
        if excel_date > 59:
            excel_date -= 1
        return datetime(1900, 1, 1, tzinfo=timezone.utc) + timedelta(days=excel_date - 2)
    except (ValueError, TypeError):
        pass

    if re.match(r'\d{1,2}-[A-Za-z]{3}', date_str):
        date_str = f"{date_str}-{datetime.now().year}"
        return datetime.strptime(date_str, "%d-%b-%Y").replace(tzinfo=timezone.utc)
    elif re.match(r'\d{1,2}/\d{1,2}/\d{4}', date_str):
        return datetime.strptime(date_str, "%d/%m/%Y").replace(tzinfo=timezone.utc)
    elif re.match(r'\d{1,2}-\d{1,2}-\d{4}', date_str):
        return datetime.strptime(date_str, "%d-%m-%Y").replace(tzinfo=timezone.utc)
    elif re.match(r'\d{4}-\d{1,2}-\d{1,2}', date_str):
        return datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    elif re.match(r'\d{4}/\d{1,2}/\d{1,2}', date_str):
        return datetime.strptime(date_str, "%Y/%m/%d").replace(tzinfo=timezone.utc)
    elif re.match(r'\d{1,2}\s+[A-Za-z]{3}\s+\d{4}', date_str):
        return datetime.strptime(date_str, "%d %b %Y").replace(tzinfo=timezone.utc)
    elif re.match(r'[A-Za-z]{3}\s+\d{1,2},?\s+\d{4}', date_str):
        return datetime.strptime(date_str.replace(',', ''), "%b %d %Y").replace(tzinfo=timezone.utc)
    else:
        try:
            from dateutil import parser
            return parser.parse(date_str).replace(tzinfo=timezone.utc)
        except Exception:
            return datetime.now(timezone.utc)


def safe_str(value) -> str:
    """Safely convert a value to string, handling NaN, None, and floats from Excel/pandas"""
    if value is None:
        return ''
    if isinstance(value, float):
        if math.isnan(value):
            return ''
        if value == int(value):
            return str(int(value))
        return str(value)
    if isinstance(value, (int, bool)):
        return str(value)
    if isinstance(value, str):
        return value.strip()
    return str(value).strip() if value else ''


async def check_customer_duplicate(mobile: str) -> bool:
    existing = await db.customers.find_one({"mobile": mobile})
    return existing is not None


async def check_vehicle_duplicate(chassis_number: str) -> bool:
    existing = await db.vehicles.find_one({"chassis_number": chassis_number})
    return existing is not None


async def create_activity(activity_data: ActivityCreate):
    activity = Activity(**activity_data.dict())
    await db.activities.insert_one(activity.dict())
    return activity
