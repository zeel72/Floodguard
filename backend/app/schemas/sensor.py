from typing import Optional, Literal
from pydantic import BaseModel, Field
import time


class SensorReadingBase(BaseModel):
    sensor_id: str = Field(..., description="Unique hardware identifier e.g. SN-101 or SENSOR_ZONE_B", example="SN-101")
    water_depth_cm: float = Field(..., ge=0.0, description="Calculated road water depth in centimeters", example=42.5)
    raw_distance_cm: Optional[float] = Field(None, description="Raw HC-SR04 ultrasonic echo travel distance in cm", example=57.5)
    rainfall_1h_mm: float = Field(default=0.0, ge=0.0, description="Accumulated rainfall over past 1 hour in mm", example=65.2)
    water_rise_rate_cm_per_min: float = Field(default=0.0, description="Rate of water height change in cm/min", example=2.4)
    battery_pct: Optional[float] = Field(default=100.0, ge=0.0, le=100.0, description="Node battery percentage", example=95.0)
    mode: Literal["real", "simulated"] = Field(default="simulated", description="Data provenance mode")
    zone_id: Optional[str] = Field(default=None, description="Associated urban zone identifier", example="ZONE_B")
    latitude: Optional[float] = Field(default=None, description="Sensor WGS84 latitude coordinate", example=19.0760)
    longitude: Optional[float] = Field(default=None, description="Sensor WGS84 longitude coordinate", example=72.8777)


class SensorReadingCreate(SensorReadingBase):
    timestamp: Optional[int] = Field(default_factory=lambda: int(time.time() * 1000), description="Unix Epoch time in milliseconds")


class SensorReadingResponse(SensorReadingBase):
    reading_id: str = Field(..., description="UUID or auto-generated reading identifier")
    timestamp: int = Field(..., description="Unix Epoch timestamp in milliseconds")
    risk_level: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"] = Field(default="LOW", description="Assessed risk level")
    success: bool = True


class SensorNode(BaseModel):
    sensor_id: str
    name: str = "Sensor Node"
    zone_id: Optional[str] = "ZONE_GENERAL"
    zone_name: Optional[str] = "General Urban Zone"
    latitude: Optional[float] = 19.0760
    longitude: Optional[float] = 72.8777
    elevation_m: Optional[float] = 10.0
    current_depth_cm: float = 0.0
    water_rise_rate_cm_per_min: float = 0.0
    battery_pct: float = 100.0
    status: Literal["ONLINE", "OFFLINE", "DEGRADED"] = "ONLINE"
    risk_level: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"] = "LOW"
    last_seen_ms: int = Field(default_factory=lambda: int(time.time() * 1000))
