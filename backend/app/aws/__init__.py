"""
AWS Cloud Infrastructure Integration Module
Manages Amazon S3 Model Repository, Amazon DynamoDB, and AWS IoT Core Telemetry Bridge.
"""

from .s3_client import s3_service, verify_s3_connection
from .iot_bridge import iot_bridge

__all__ = ["s3_service", "verify_s3_connection", "iot_bridge"]
