from fastapi import APIRouter
from api.v1.auth.endpoints.auth import router as auth_router

API_V1_AUTH_ROUTER = APIRouter(prefix="/api/v1/auth", tags=["auth"])
API_V1_AUTH_ROUTER.include_router(auth_router)
