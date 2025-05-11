from fastapi import APIRouter, Body
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/hello")
async def hello():
    """Simple test endpoint to verify API connectivity"""
    logger.info("Hello endpoint called")
    return {"message": "Hello from LinkedOut API!"}

@router.post("/echo")
async def echo(data: dict = Body(...)):
    """Echo back the received data to test POST requests"""
    logger.info(f"Echo endpoint called with data: {data}")
    return {"message": "Echo successful", "received": data}