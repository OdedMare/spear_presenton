from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from utils.logger import logger, ElasticsearchHandler
import logging
import os
import uuid

router = APIRouter()

class TestLoggingRequest(BaseModel):
    url: Optional[str] = None
    user: Optional[str] = None
    password: Optional[str] = None
    disable_ssl_verify: Optional[bool] = False

@router.post("/test-logging")
async def test_logging(request: TestLoggingRequest = TestLoggingRequest()):
    """
    Test the Elasticsearch connection by attempting to write a log.
    If credentials are provided, attempts to use them.
    Otherwise, uses the system configuration.
    """
    try:
        # Determine which configuration to use
        es_url = request.url or os.getenv("ELASTICSEARCH_URL")
        es_user = request.user or os.getenv("ELASTICSEARCH_USER")
        es_password = request.password or os.getenv("ELASTICSEARCH_PASSWORD")
        disable_ssl = request.disable_ssl_verify if request.disable_ssl_verify is not None else (os.getenv("DISABLE_SSL_VERIFY", "false").lower() == "true")

        if not es_url:
            return {
                "status": "warning", 
                "message": "Elasticsearch is not configured. Logs will only go to console."
            }

        # Create a unique test ID
        test_id = str(uuid.uuid4())
        
        # If parameters are provided or we are testing system config, we want to try explicitly
        # To verify the WRITE, we'll create a temporary handler
        
        temp_logger = logging.getLogger(f"test_logger_{test_id}")
        temp_logger.setLevel(logging.INFO)
        
        # Avoid propagating to root to prevent duplicate console logs if we add a handler
        temp_logger.propagate = False 

        # Add temporary Elasticsearch handler
        try:
            handler = ElasticsearchHandler(
                elasticsearch_url=es_url,
                index_prefix=os.getenv("ELASTICSEARCH_INDEX_PREFIX", "presenton-logs")
            )
            
            # Configure auth on the handler session
            if es_user and es_password:
                handler.session.auth = (es_user, es_password)
                
            if disable_ssl:
                handler.session.verify = False
                import urllib3
                urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
                
            temp_logger.addHandler(handler)
            
            # Write the log
            log_record = {
                "event_type": "test_connection",
                "source": "ui_test", 
                "test_id": test_id,
                "user_provided_config": bool(request.url)
            }
            
            temp_logger.info("Test log from UI - checking Elasticsearch connection", extra={"extra_fields": log_record})
            
            # Since the handler emits via requests.post (sync), if it raised no exception, we assume it sent?
            # Wait, the handler swallows exceptions with print(stderr).
            # We need to verify if it worked. The standard Handler implementation in logger.py catches exceptions.
            # Let's inspect the handler code again. It wraps in try/except.
            # To be sure, we should try a direct request here using the same logic as the handler but without swallowing errors.
            
            # Manual write attempt to verify connectivity and write permissions
            import datetime
            index_name = f"{handler.index_prefix}-{datetime.datetime.utcnow().strftime('%Y.%m.%d')}"
            url = f"{es_url}/{index_name}/_doc"
             
            # Prepare headers/auth
            headers = {"Content-Type": "application/json"}
            
            # We already set up the session in the handler, let's just reuse it or make a new request
            resp = handler.session.post(
                url,
                json={
                    "@timestamp": datetime.datetime.utcnow().isoformat(),
                    "level": "INFO",
                    "logger": "test_verification",
                    "message": "Verifying write permissions from UI test",
                    **log_record
                },
                headers=headers,
                timeout=5
            )
            
            resp.raise_for_status()
            
            return {
                "status": "success",
                "message": f"Successfully wrote test log to {es_url}",
                "doc_id": resp.json().get("_id")
            }

        except Exception as e:
            msg = str(e)
            if "Connection refused" in msg:
                msg = "Connection Refused - Check URL and Port"
            elif "401" in msg:
                msg = "Authentication Failed - Check Username/Password"
            elif "403" in msg:
                msg = "Permission Denied - Check User Roles"
            elif "404" in msg:
                msg = f"Not Found - Check URL ({es_url})"
                
            logger.warning(f"Test logging failed: {msg}")
            return {
                "status": "error",
                "message": f"Failed to write log: {msg}"
            }
            
    except Exception as e:
        logger.error(f"Test logging failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to send test log: {str(e)}")
