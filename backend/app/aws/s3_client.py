import os
import logging
from typing import Dict, Any, List, Optional
import boto3
from botocore.exceptions import ClientError, BotoCoreError

try:
    from app.config import settings
except ImportError:
    from backend.app.config import settings

logger = logging.getLogger("floodguard.aws.s3")


class S3ModelService:
    """
    Amazon S3 Client for FloodGuard ML Model Synchronization and Storage.
    Provides automated cloud synchronization for trained XGBoost model artifacts
    with zero-friction local filesystem fallback.
    """

    def __init__(self):
        self.bucket_name = settings.S3_BUCKET_MODELS
        self.region = settings.AWS_REGION
        self.client = None
        self._init_client()

    def _init_client(self):
        if settings.is_aws_configured:
            try:
                self.client = boto3.client(
                    "s3",
                    region_name=self.region,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                )
                logger.info(f"[S3] Initialized Boto3 client for bucket: {self.bucket_name} in {self.region}")
            except Exception as e:
                logger.warning(f"[S3] Failed to initialize Boto3 S3 client: {e}")
                self.client = None
        else:
            logger.info("[S3] AWS credentials not configured. Local artifact mode active.")
            self.client = None

    def is_connected(self) -> bool:
        """Verify if S3 bucket is accessible and ready."""
        if not self.client:
            return False
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
            return True
        except (ClientError, BotoCoreError) as e:
            logger.warning(f"[S3] HeadBucket check failed: {e}")
            return False

    def verify_connection(self) -> Dict[str, Any]:
        """Comprehensive S3 health and inventory audit."""
        if not self.client:
            return {
                "connected": False,
                "status": "unconfigured_local_fallback",
                "bucket": self.bucket_name,
                "region": self.region,
                "artifacts": []
            }

        try:
            self.client.head_bucket(Bucket=self.bucket_name)
            resp = self.client.list_objects_v2(Bucket=self.bucket_name, Prefix="models/")
            contents = resp.get("Contents", [])
            artifact_keys = [obj["Key"] for obj in contents]

            return {
                "connected": True,
                "status": "active_cloud_storage",
                "bucket": self.bucket_name,
                "region": self.region,
                "artifact_count": len(artifact_keys),
                "artifacts": artifact_keys
            }
        except Exception as e:
            return {
                "connected": False,
                "status": f"error: {str(e)}",
                "bucket": self.bucket_name,
                "region": self.region,
                "artifacts": []
            }

    def sync_models_from_s3(self, target_dir: str) -> bool:
        """
        Download trained model artifacts from S3 bucket into local directory
        if local files are missing or cloud models are available.
        """
        if not self.client:
            logger.info("[S3] S3 client offline. Skipping S3 download; using local artifacts.")
            return False

        os.makedirs(target_dir, exist_ok=True)
        model_files = ["model_30m.joblib", "model_60m.joblib", "model_meta.json"]
        downloaded = 0

        try:
            for fname in model_files:
                s3_key = f"models/{fname}"
                local_path = os.path.join(target_dir, fname)

                # Download if missing or cloud source preferred
                try:
                    logger.info(f"[S3] Downloading s3://{self.bucket_name}/{s3_key} -> {local_path}")
                    self.client.download_file(self.bucket_name, s3_key, local_path)
                    downloaded += 1
                except ClientError as ce:
                    logger.warning(f"[S3] Object {s3_key} not found in S3 bucket ({ce}).")

            logger.info(f"[S3] Sync complete: {downloaded}/{len(model_files)} artifacts loaded from S3.")
            return downloaded > 0
        except Exception as e:
            logger.error(f"[S3] Error during model synchronization from S3: {e}")
            return False

    def upload_artifact(self, local_path: str, s3_key: Optional[str] = None) -> bool:
        """Upload a local ML artifact or dataset to S3."""
        if not self.client:
            logger.warning("[S3] Cannot upload: S3 client offline.")
            return False

        if not os.path.exists(local_path):
            logger.error(f"[S3] Local file does not exist: {local_path}")
            return False

        if not s3_key:
            fname = os.path.basename(local_path)
            s3_key = f"models/{fname}"

        try:
            self.client.upload_file(local_path, self.bucket_name, s3_key)
            logger.info(f"[S3] Successfully uploaded {local_path} -> s3://{self.bucket_name}/{s3_key}")
            return True
        except Exception as e:
            logger.error(f"[S3] Upload failed for {local_path}: {e}")
            return False


s3_service = S3ModelService()


def verify_s3_connection() -> Dict[str, Any]:
    """Helper function to audit S3 connectivity status."""
    return s3_service.verify_connection()
