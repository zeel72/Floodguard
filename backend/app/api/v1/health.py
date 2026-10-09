from fastapi import APIRouter
from pydantic import BaseModel
import time

try:
    from app.config import settings
except ImportError:
    from backend.app.config import settings

router = APIRouter(tags=["Health & Status"])


class HealthResponse(BaseModel):
    status: str = "ok"
    mode: str
    aws_connected: bool
    timestamp: str
    version: str = "1.0.0"
    environment: str


@router.get("/health", response_model=HealthResponse)
def get_health_status():
    """
    Returns system operational health, current telemetry/simulation mode,
    and cloud infrastructure connection status.
    """
    return HealthResponse(
        status="ok",
        mode=settings.MODE,
        aws_connected=settings.is_aws_configured,
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        version="1.0.0",
        environment=settings.ENVIRONMENT
    )
