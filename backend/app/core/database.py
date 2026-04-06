from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

# Configure MongoDB client with proper timeouts and SSL settings
client_options = {
    'serverSelectionTimeoutMS': 30000,
    'connectTimeoutMS': 30000,
    'socketTimeoutMS': 30000,
    'maxPoolSize': 50,
    'minPoolSize': 10,
    'retryWrites': True,
    'retryReads': True,
}

if settings.IS_ATLAS:
    client_options.update({
        'tls': True,
        'tlsAllowInvalidCertificates': False
    })

# The client and db objects will be initialized when the connection is setup during app startup.
client = AsyncIOMotorClient(settings.MONGO_URL, **client_options)
db = client[settings.DB_NAME]

async def next_sequence(name: str) -> int:
    """Atomically increment a named counter — prevents duplicate invoice/job numbers."""
    result = await db.counters.find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return result["seq"]
