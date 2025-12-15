from fastapi import APIRouter
from api.v1.config.endpoints.elasticsearch import ELASTICSEARCH_ROUTER

config_router = APIRouter(prefix="/config", tags=["Config"])

config_router.include_router(ELASTICSEARCH_ROUTER)
