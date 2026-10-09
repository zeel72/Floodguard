from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field


RiskLevelType = Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]


class PredictionFactor(BaseModel):
    feature_name: str
    contribution_weight: float
    description: str


class PredictionRequest(BaseModel):
    zone_id: str = Field(..., description="Urban zone identifier e.g. ZONE_B_UNDERPASS", example="ZONE_B_UNDERPASS")
    rainfall_1h_mm: float = Field(..., ge=0.0, description="1-hour rainfall precipitation in mm", example=72.5)
    current_water_depth_cm: float = Field(..., ge=0.0, description="Current road water depth in cm", example=65.0)
    water_rise_rate_cm_per_min: float = Field(default=0.0, description="Water rise velocity in cm/min", example=3.2)
    elevation_m: Optional[float] = Field(default=8.5, description="Topographical road elevation in meters", example=6.2)
    drainage_capacity_index: Optional[float] = Field(default=0.6, ge=0.0, le=1.0, description="Drainage factor 0.0 (blocked) to 1.0 (clear)", example=0.45)
    soil_saturation_pct: Optional[float] = Field(default=80.0, ge=0.0, le=100.0, description="Soil catchment saturation level percentage", example=88.0)


class PredictionResponse(BaseModel):
    zone_id: str
    current_depth_cm: float
    predicted_depth_30m_cm: float
    predicted_depth_60m_cm: float
    risk_level: RiskLevelType
    submergence_probability_pct: float
    time_to_critical_min: Optional[float] = None
    model_version: str = "xgboost-hydrology-v1"
    top_factors: List[PredictionFactor] = Field(default_factory=list)
    recommendation: Optional[str] = None


class ZonePrediction(BaseModel):
    zone_id: str
    zone_name: str
    current_depth_cm: float
    predicted_depth_30m_cm: float
    predicted_depth_60m_cm: float
    risk_level: RiskLevelType
    time_to_critical_min: Optional[float] = None
    submergence_probability_pct: float
    elevation_m: float
    sensor_id: Optional[str] = None
