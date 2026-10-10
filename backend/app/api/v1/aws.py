import os
import time
from fastapi import APIRouter
from typing import Dict, Any

try:
    from app.config import settings
    from app.aws.s3_client import s3_service
    from app.aws.iot_bridge import iot_bridge
    from app.db.dynamodb import db
except ImportError:
    from backend.app.config import settings
    from backend.app.aws.s3_client import s3_service
    from backend.app.aws.iot_bridge import iot_bridge
    from backend.app.db.dynamodb import db

router = APIRouter(prefix="/aws", tags=["AWS Cloud Infrastructure"])


@router.get("/status")
def get_aws_status() -> Dict[str, Any]:
    """
    Comprehensive audit of connected AWS Cloud Infrastructure:
    - Amazon DynamoDB Tables
    - Amazon S3 Model Repository
    - AWS IoT Core Telemetry Bridge
    """
    dynamodb_status = {
        "connected": db.is_cloud_active,
        "mode": "dynamodb_cloud" if db.is_cloud_active else "local_memory_fallback",
        "tables": {
            "sensors": settings.DYNAMODB_TABLE_SENSORS,
            "zones": settings.DYNAMODB_TABLE_ZONES
        }
    }

    s3_status = s3_service.verify_connection()
    iot_status = iot_bridge.get_status()

    return {
        "aws_connected": settings.is_aws_configured,
        "region": settings.AWS_REGION,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "services": {
            "dynamodb": dynamodb_status,
            "s3": s3_status,
            "iot_core": iot_status
        }
    }


@router.post("/sync-models")
def sync_models_from_s3() -> Dict[str, Any]:
    """
    Manually trigger synchronization of trained XGBoost model artifacts
    from the Amazon S3 bucket into the local ML inference directory.
    """
    artifacts_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "ml", "artifacts")
    success = s3_service.sync_models_from_s3(artifacts_dir)
    return {
        "success": success,
        "target_directory": artifacts_dir,
        "bucket": settings.S3_BUCKET_MODELS,
        "region": settings.AWS_REGION
    }
