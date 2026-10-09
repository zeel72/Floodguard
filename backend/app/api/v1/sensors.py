from fastapi import APIRouter, HTTPException, status
from typing import List
import uuid
import time

try:
    from app.schemas.sensor import (
        SensorReadingCreate, 
        SensorReadingResponse, 
        SensorNode
    )
    from app.config import settings
    from app.db.dynamodb import db
except ImportError:
    from backend.app.schemas.sensor import (
        SensorReadingCreate, 
        SensorReadingResponse, 
        SensorNode
    )
    from backend.app.config import settings
    from backend.app.db.dynamodb import db

router = APIRouter(tags=["Sensors & IoT Telemetry"])


def _persist_reading(reading: SensorReadingCreate) -> SensorReadingResponse:
    # Evaluate risk category based on depth
    if reading.water_depth_cm >= settings.CRITICAL_WATER_DEPTH_CM:
        risk = "CRITICAL"
    elif reading.water_depth_cm >= settings.HIGH_WATER_DEPTH_CM:
        risk = "HIGH"
    elif reading.water_depth_cm >= settings.MODERATE_WATER_DEPTH_CM:
        risk = "MODERATE"
    else:
        risk = "LOW"

    reading_dict = {
        "reading_id": str(uuid.uuid4()),
        "sensor_id": reading.sensor_id,
        "timestamp": reading.timestamp or int(time.time() * 1000),
        "water_depth_cm": reading.water_depth_cm,
        "raw_distance_cm": reading.raw_distance_cm,
        "rainfall_1h_mm": reading.rainfall_1h_mm,
        "water_rise_rate_cm_per_min": reading.water_rise_rate_cm_per_min,
        "battery_pct": reading.battery_pct,
        "mode": reading.mode,
        "zone_id": reading.zone_id,
        "latitude": reading.latitude,
        "longitude": reading.longitude,
        "risk_level": risk,
        "success": True
    }

    # Persist via DynamoDB / Memory Fallback Layer
    db.save_sensor_reading(reading_dict)

    return SensorReadingResponse(**reading_dict)


@router.get("/sensors", response_model=List[SensorNode])
def list_sensors():
    """Retrieve list of all registered ultrasonic sensor nodes and their current readings from active database."""
    raw_sensors = db.list_all_sensors()
    return [SensorNode(**s) for s in raw_sensors]


@router.get("/sensors/{sensor_id}/readings")
def get_sensor_history(sensor_id: str, limit: int = 50):
    """Query chronological telemetry history for a specific sensor."""
    return db.get_sensor_readings(sensor_id, limit)


@router.post("/sensor-data", response_model=SensorReadingResponse, status_code=status.HTTP_201_CREATED)
def ingest_sensor_data(reading: SensorReadingCreate):
    """
    Ingest a telemetry packet from ESP8266 hardware or the synthetic simulation generator
    and persist into Amazon DynamoDB / Memory Store.
    """
    return _persist_reading(reading)


@router.post("/sensors/reading", response_model=SensorReadingResponse, status_code=status.HTTP_201_CREATED)
def ingest_sensor_reading_alias(reading: SensorReadingCreate):
    """Alias for /sensor-data endpoint."""
    return _persist_reading(reading)
