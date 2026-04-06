import os
from pathlib import Path
from dotenv import load_dotenv
import logging

# Configure basic logging that will be used everywhere
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load env variables
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / '.env')

class Settings:
    MONGO_URL: str = os.environ.get('MONGO_URL', '')
    DB_NAME: str = os.environ.get('DB_NAME', 'mmmotors')
    JWT_SECRET_KEY: str = os.environ.get('JWT_SECRET_KEY', 'default_secret_key')
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    IS_ATLAS: bool = 'mongodb.net' in MONGO_URL or 'mongodb+srv' in MONGO_URL

settings = Settings()
