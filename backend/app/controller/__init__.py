from fastapi import APIRouter

from app.controller.auth import router as auth_router
from app.controller.user import router as user_router
from app.controller.profile import router as profile_router
from app.controller.test import router as test_router
from app.controller.connection import router as connection_router
from app.controller.post import router as post_router
from app.controller.notification import router as notification_router
from app.controller.job import router as job_router
# Temporarily comment out other controllers for initial testing
# from app.controller.connection import router as connection_router
# from app.controller.post import router as post_router
# from app.controller.notification import router as notification_router
# from app.controller.job import router as job_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(user_router, prefix="/users", tags=["users"])
api_router.include_router(profile_router, prefix="/profiles", tags=["profiles"])
api_router.include_router(test_router, prefix="/test", tags=["test"])
api_router.include_router(connection_router, prefix="/connections", tags=["connections"])
api_router.include_router(post_router, prefix="/posts", tags=["posts"])
api_router.include_router(notification_router, prefix="/notifications", tags=["notifications"])
api_router.include_router(job_router, prefix="/jobs", tags=["jobs"])
# api_router.include_router(connection_router, prefix="/connections", tags=["connections"])
# api_router.include_router(post_router, prefix="/posts", tags=["posts"])
# api_router.include_router(notification_router, prefix="/notifications", tags=["notifications"])
# api_router.include_router(job_router, prefix="/jobs", tags=["jobs"])