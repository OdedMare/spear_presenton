from fastapi import APIRouter
from utils.logger import reinitialize_logger
from utils.user_config import update_env_with_user_config

router = APIRouter()

@router.post("/reinitialize-logger")
async def reinitialize_logger_endpoint():
    """
    Reinitialize the logger with updated configuration.
    This endpoint should be called after updating user configuration
    to apply Elasticsearch logging changes without requiring a server restart.
    """
    try:
        # First, reload user config into environment variables
        update_env_with_user_config()

        # Then reinitialize the logger with the new config
        success = reinitialize_logger()

        if success:
            return {
                "status": "success",
                "message": "Logger reinitialized successfully with updated configuration"
            }
        else:
            return {
                "status": "error",
                "message": "Failed to reinitialize logger"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to reinitialize logger: {str(e)}"
        }
