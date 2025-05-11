"""
Debug script to run the FastAPI application with detailed logging and diagnostics.
Run with: python -m debug
"""

import logging
import sys
import uvicorn

# Configure detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)

# Set SQLAlchemy logging level to debug to see all SQL statements
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Run the application with debug settings
if __name__ == "__main__":
    print("Starting FastAPI in DEBUG mode...")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug",
        timeout_keep_alive=120  # Increase timeout to 2 minutes for debugging
    )