from firebase_admin import firestore
import logging
from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    # Initialize Firestore
    db = firestore.client()
    logger.info("Firebase Firestore connection established successfully")
except Exception as e:
    logger.error(f"Failed to connect to Firestore: {str(e)}")
    raise

def get_db():
    """Get Firestore database instance."""
    return db