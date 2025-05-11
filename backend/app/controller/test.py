from fastapi import APIRouter, Body, Request
from typing import Any, Dict
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/hello")
async def test_hello():
    """Simple GET test endpoint that returns a hello message."""
    logger.info("Test hello endpoint called")
    return {"message": "Hello from the LinkedOut API!"}


@router.post("/echo")
async def test_echo(data: Dict[str, Any] = Body(...)):
    """Echo back any JSON data sent to this endpoint."""
    logger.info(f"Echo endpoint called with data: {data}")
    return {"echo": data}


@router.get("/check")
async def check_connection():
    """Check if the API is connected."""
    logger.info("Connection check endpoint called")
    return {"status": "connected"}


@router.get("/request-info")
async def request_info(request: Request):
    """Return information about the request for debugging."""
    client_host = request.client.host if request.client else "Unknown"
    headers = dict(request.headers)

    # Don't log the full headers as they might contain sensitive info
    logger.info(f"Request info endpoint called from {client_host}")

    return {
        "client": {
            "host": client_host,
            "port": request.client.port if request.client else "Unknown"
        },
        "headers": headers,
        "method": request.method,
        "url": str(request.url)
    }