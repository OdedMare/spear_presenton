import os
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

ELASTICSEARCH_ROUTER = APIRouter(prefix="/elasticsearch", tags=["Config"])


class ElasticsearchTestRequest(BaseModel):
    url: str
    user: Optional[str] = None
    password: Optional[str] = None
    disable_ssl_verify: bool = False


class ElasticsearchTestResponse(BaseModel):
    success: bool
    message: str
    cluster_name: Optional[str] = None
    version: Optional[str] = None


@ELASTICSEARCH_ROUTER.post("/test-connection", response_model=ElasticsearchTestResponse)
async def test_elasticsearch_connection(request: ElasticsearchTestRequest):
    """Test Elasticsearch connection with provided credentials."""
    try:
        import requests
        from requests.auth import HTTPBasicAuth

        session = requests.Session()

        # Configure SSL verification
        if request.disable_ssl_verify:
            session.verify = False
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

        # Configure authentication
        auth = None
        if request.user and request.password:
            auth = HTTPBasicAuth(request.user, request.password)

        # Test connection by getting cluster info
        response = session.get(
            request.url,
            auth=auth,
            timeout=5
        )

        if response.status_code == 200:
            data = response.json()
            return ElasticsearchTestResponse(
                success=True,
                message="Successfully connected to Elasticsearch",
                cluster_name=data.get("cluster_name"),
                version=data.get("version", {}).get("number")
            )
        else:
            return ElasticsearchTestResponse(
                success=False,
                message=f"Failed to connect: HTTP {response.status_code} - {response.text[:100]}"
            )

    except requests.exceptions.ConnectionError as e:
        return ElasticsearchTestResponse(
            success=False,
            message=f"Connection error: Could not reach Elasticsearch at {request.url}"
        )
    except requests.exceptions.Timeout:
        return ElasticsearchTestResponse(
            success=False,
            message="Connection timeout: Elasticsearch took too long to respond"
        )
    except requests.exceptions.RequestException as e:
        return ElasticsearchTestResponse(
            success=False,
            message=f"Request error: {str(e)}"
        )
    except Exception as e:
        return ElasticsearchTestResponse(
            success=False,
            message=f"Unexpected error: {str(e)}"
        )
