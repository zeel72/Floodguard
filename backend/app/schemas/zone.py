from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field


class ZoneBase(BaseModel):
    zone_id: str = Field(..., description="Unique zone identifier", example="ZONE_B")
    name: str = Field(..., description="Human readable zone name", example="Central Railway Underpass")
    elevation_m: float = Field(..., description="Average elevation in meters", example=6.2)
    drainage_capacity_index: float = Field(default=0.5, ge=0.0, le=1.0)
    latitude: float = Field(..., example=19.0760)
    longitude: float = Field(..., example=72.8777)
    boundary_coordinates: Optional[List[List[float]]] = Field(default=None, description="GeoJSON polygon ring")


class ZoneStatus(ZoneBase):
    current_water_depth_cm: float = 0.0
    predicted_depth_30m_cm: float = 0.0
    predicted_depth_60m_cm: float = 0.0
    risk_level: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"] = "LOW"
    time_to_critical_min: Optional[float] = None
    sensor_id: Optional[str] = None
    updated_at_ms: int = 0
