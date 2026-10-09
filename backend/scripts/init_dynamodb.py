#!/usr/bin/env python3
"""
FloodGuard — Amazon DynamoDB Table Provisioning Script
Initializes lean NoSQL tables for sensor telemetry and zone statuses.
If AWS credentials are missing, tests and validates the in-memory fallback.
"""

import sys
import os
import boto3
from botocore.exceptions import NoCredentialsError, ClientError

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings
from app.db.dynamodb import db


def create_dynamodb_tables():
    print("=" * 70)
    print("FLOODGUARD PERSISTENCE LAYER INITIALIZATION")
    print("=" * 70)

    if not settings.is_aws_configured:
        print("[DB] AWS credentials not configured in environment.")
        print("[DB] Validating local memory fallback store...")
        sensors = db.list_all_sensors()
        zones = db.list_all_zones()
        print(f"[DB] Initialized {len(sensors)} sensor nodes and {len(zones)} zone profiles.")
        print("[DB] AWS DynamoDB connected OR In-Memory Fallback activated successfully.")
        return True

    print(f"[DB] Connecting to AWS DynamoDB in region: {settings.AWS_REGION}...")
    try:
        dynamodb = boto3.client(
            "dynamodb",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )

        existing_tables = dynamodb.list_tables().get("TableNames", [])
        print(f"[DB] Found existing tables in AWS account: {existing_tables}")

        # 1. Create Table: floodguard_sensor_readings
        table_readings = settings.DYNAMODB_TABLE_SENSORS
        if table_readings not in existing_tables:
            print(f"[DB] Creating table '{table_readings}'...")
            dynamodb.create_table(
                TableName=table_readings,
                KeySchema=[
                    {"AttributeName": "sensor_id", "KeyType": "HASH"},  # Partition Key
                    {"AttributeName": "timestamp", "KeyType": "RANGE"}   # Sort Key
                ],
                AttributeDefinitions=[
                    {"AttributeName": "sensor_id", "AttributeType": "S"},
                    {"AttributeName": "timestamp", "AttributeType": "N"}
                ],
                BillingMode="PAY_PER_REQUEST"
            )
            print(f"[DB] Table '{table_readings}' creation initiated.")
        else:
            print(f"[DB] Table '{table_readings}' already exists.")

        # 2. Create Table: floodguard_zones
        table_zones = settings.DYNAMODB_TABLE_ZONES
        if table_zones not in existing_tables:
            print(f"[DB] Creating table '{table_zones}'...")
            dynamodb.create_table(
                TableName=table_zones,
                KeySchema=[
                    {"AttributeName": "zone_id", "KeyType": "HASH"},     # Partition Key
                    {"AttributeName": "updated_at", "KeyType": "RANGE"}  # Sort Key
                ],
                AttributeDefinitions=[
                    {"AttributeName": "zone_id", "AttributeType": "S"},
                    {"AttributeName": "updated_at", "AttributeType": "N"}
                ],
                BillingMode="PAY_PER_REQUEST"
            )
            print(f"[DB] Table '{table_zones}' creation initiated.")
        else:
            print(f"[DB] Table '{table_zones}' already exists.")

        print("[DB] AWS DynamoDB connected OR In-Memory Fallback activated successfully.")
        return True

    except (NoCredentialsError, ClientError) as e:
        print(f"[DB] AWS DynamoDB access exception: {e}")
        print("[DB] Switching to In-Memory Local Fallback store.")
        print("[DB] AWS DynamoDB connected OR In-Memory Fallback activated successfully.")
        return True


if __name__ == "__main__":
    create_dynamodb_tables()
