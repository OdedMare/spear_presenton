from fastapi import APIRouter
from api.v1.system.endpoints import test_logging, reinit_logger

API_V1_SYSTEM_ROUTER = APIRouter(prefix="/api/v1/system", tags=["System"])
API_V1_SYSTEM_ROUTER.include_router(test_logging.router)
API_V1_SYSTEM_ROUTER.include_router(reinit_logger.router)
