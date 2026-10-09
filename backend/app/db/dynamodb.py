import logging
from typing import Dict, List, Optional, Any
from decimal import Decimal
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError, ClientError, EndpointConnectionError

try:
    from app.config import settings
    from app.db.memory_store import memory_store
except ImportError:
    from backend.app.config import settings
    from backend.app.db.memory_store import memory_store

logger = logging.getLogger("floodguard.db")


def _convert_floats_to_decimals(obj: Any) -> Any:
    """Helper to convert Python floats to Decimal for DynamoDB serialization."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: _convert_floats_to_decimals(v) for k, v in obj.items() if v is not None}
    elif isinstance(obj, list):
        return [_convert_floats_to_decimals(v) for v in obj]
    return obj


def _convert_decimals_to_floats(obj: Any) -> Any:
    """Helper to convert DynamoDB Decimal types back to Python float/int."""
    if isinstance(obj, Decimal):
        return float(obj) if "." in str(obj) else int(obj)
    elif isinstance(obj, dict):
        return {k: _convert_decimals_to_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_convert_decimals_to_floats(v) for v in obj]
    return obj


class DynamoDBClient:
    """
    Amazon DynamoDB Storage Connector with Transparent Local Fallback.
    If AWS credentials or cloud services are unreachable, operations automatically
    fall back to the high-speed thread-safe in-memory store without failing.
    """

    def __init__(self):
        self.use_aws: bool = False
        self.dynamodb_resource = None
        self.sensors_table = None
        self.zones_table = None
        self.init_connection()

    def init_connection(self):
        """Attempt connection to AWS DynamoDB if credentials are provided."""
        if not settings.is_aws_configured:
            logger.info("[DB] AWS credentials not found. In-Memory Local Fallback activated.")
            self.use_aws = False
            return

        try:
            session = boto3.Session(
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            self.dynamodb_resource = session.resource("dynamodb")
            self.sensors_table = self.dynamodb_resource.Table(settings.DYNAMODB_TABLE_SENSORS)
            self.zones_table = self.dynamodb_resource.Table(settings.DYNAMODB_TABLE_ZONES)
            
            # Verify table accessibility
            self.sensors_table.load()
            self.use_aws = True
            logger.info(f"[DB] Connected to Amazon DynamoDB in {settings.AWS_REGION}")
        except (NoCredentialsError, PartialCredentialsError, ClientError, EndpointConnectionError) as e:
            logger.warning(f"[DB] DynamoDB connection failed ({e}). Reverting to In-Memory Fallback.")
            self.use_aws = False

    def is_connected(self) -> bool:
        """Returns True if live AWS DynamoDB is active."""
        return self.use_aws

    def save_sensor_reading(self, reading: Dict[str, Any]) -> Dict[str, Any]:
        """Persist a sensor reading to DynamoDB or fallback store."""
        # Always update memory store for instant in-process caching
        memory_store.save_sensor_reading(reading)

        if self.use_aws and self.sensors_table:
            try:
                dynamo_item = _convert_floats_to_decimals(reading)
                self.sensors_table.put_item(Item=dynamo_item)
            except ClientError as e:
                logger.error(f"[DB] DynamoDB put_item failed: {e}. Preserved in local memory.")

        return reading

    def get_sensor_readings(self, sensor_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Query latest readings for a given sensor."""
        if self.use_aws and self.sensors_table:
            try:
                from boto3.dynamodb.conditions import Key
                response = self.sensors_table.query(
                    KeyConditionExpression=Key("sensor_id").eq(sensor_id),
                    ScanIndexForward=False, # Descending by timestamp
                    Limit=limit
                )
                items = response.get("Items", [])
                return [_convert_decimals_to_floats(item) for item in items]
            except ClientError as e:
                logger.warning(f"[DB] DynamoDB query failed: {e}. Falling back to memory.")

        return memory_store.get_sensor_readings(sensor_id, limit)

    def list_all_sensors(self) -> List[Dict[str, Any]]:
        """Return all active sensors."""
        return memory_store.list_all_sensors()

    def save_zone(self, zone_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save zone status to DynamoDB and memory store."""
        memory_store.save_zone(zone_data)

        if self.use_aws and self.zones_table:
            try:
                dynamo_item = _convert_floats_to_decimals(zone_data)
                self.zones_table.put_item(Item=dynamo_item)
            except ClientError as e:
                logger.error(f"[DB] DynamoDB put_item for zone failed: {e}.")

        return zone_data

    def get_zone(self, zone_id: str) -> Optional[Dict[str, Any]]:
        return memory_store.get_zone(zone_id)

    def list_all_zones(self) -> List[Dict[str, Any]]:
        return memory_store.list_all_zones()


# Singleton instance
db = DynamoDBClient()
