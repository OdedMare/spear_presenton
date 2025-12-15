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
        import urllib3

        session = requests.Session()

        # Configure SSL verification
        if request.disable_ssl_verify:
            session.verify = False
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
                message="התחברות ל-Elasticsearch הצליחה! (Successfully connected to Elasticsearch)",
                cluster_name=data.get("cluster_name"),
                version=data.get("version", {}).get("number")
            )
        elif response.status_code == 401:
            return ElasticsearchTestResponse(
                success=False,
                message="שגיאת אימות: שם משתמש או סיסמה שגויים (Authentication failed: Invalid username or password)"
            )
        elif response.status_code == 403:
            return ElasticsearchTestResponse(
                success=False,
                message="שגיאת הרשאות: למשתמש אין הרשאות גישה (Permission denied: User lacks access rights)"
            )
        elif response.status_code == 404:
            return ElasticsearchTestResponse(
                success=False,
                message="הכתובת לא נמצאה: ודא שה-URL נכון ומצביע ל-Elasticsearch (URL not found: Verify the URL points to Elasticsearch)"
            )
        elif response.status_code >= 500:
            return ElasticsearchTestResponse(
                success=False,
                message=f"שגיאת שרת Elasticsearch (HTTP {response.status_code}): השרת נתקל בבעיה (Elasticsearch server error)"
            )
        else:
            # Try to parse error response
            try:
                error_data = response.json()
                error_msg = error_data.get("error", {}).get("reason", response.text[:200])
            except:
                error_msg = response.text[:200]

            return ElasticsearchTestResponse(
                success=False,
                message=f"החיבור נכשל (HTTP {response.status_code}): {error_msg}"
            )

    except requests.exceptions.SSLError as e:
        return ElasticsearchTestResponse(
            success=False,
            message="שגיאת SSL: התעודה אינה חוקית. נסה להפעיל 'השבת אימות SSL' אם אתה משתמש בתעודות חתומות עצמית (SSL certificate error: Try enabling 'Disable SSL Verify')"
        )
    except requests.exceptions.ConnectionError as e:
        error_str = str(e).lower()
        if "name or service not known" in error_str or "nodename nor servname provided" in error_str:
            return ElasticsearchTestResponse(
                success=False,
                message=f"שם הדומיין לא נמצא: לא ניתן למצוא את '{request.url}'. ודא שה-URL נכון (Domain not found: Cannot resolve hostname)"
            )
        elif "connection refused" in error_str:
            return ElasticsearchTestResponse(
                success=False,
                message=f"החיבור נדחה: השרת ב-{request.url} לא מקבל חיבורים. ודא שהשרת פועל ושהפורט נכון (Connection refused: Server not accepting connections)"
            )
        elif "no route to host" in error_str:
            return ElasticsearchTestResponse(
                success=False,
                message="אין מסלול לשרת: לא ניתן להגיע לשרת. בדוק הגדרות רשת וחומת אש (No route to host: Network or firewall issue)"
            )
        else:
            return ElasticsearchTestResponse(
                success=False,
                message=f"שגיאת חיבור: לא ניתן להתחבר ל-{request.url}. בדוק שהשרת פועל ושה-URL נכון (Connection error: Cannot reach server)"
            )
    except requests.exceptions.Timeout:
        return ElasticsearchTestResponse(
            success=False,
            message="זמן החיבור פג: השרת לא הגיב תוך 5 שניות. ייתכן שהשרת עמוס או שיש בעיית רשת (Timeout: Server did not respond within 5 seconds)"
        )
    except requests.exceptions.InvalidURL:
        return ElasticsearchTestResponse(
            success=False,
            message=f"URL לא תקין: '{request.url}' אינו כתובת חוקית. ודא שהפורמט הוא http://hostname:port (Invalid URL format)"
        )
    except requests.exceptions.RequestException as e:
        return ElasticsearchTestResponse(
            success=False,
            message=f"שגיאת בקשה: {str(e)} (Request error)"
        )
    except ImportError:
        return ElasticsearchTestResponse(
            success=False,
            message="ספריית requests אינה מותקנת. יש להתקין את התלויות (requests library not installed)"
        )
    except Exception as e:
        return ElasticsearchTestResponse(
            success=False,
            message=f"שגיאה בלתי צפויה: {str(e)} (Unexpected error)"
        )
