from fastapi import APIRouter
from typing import List, Optional
from pydantic import BaseModel

try:
    from app.core.simulator import simulator
    from app.core.flood_engine import evaluate_zone_risk, generate_zone_alerts
    from app.ml.model import predict_water_level
except ImportError:
    from backend.app.core.simulator import simulator
    from backend.app.core.flood_engine import evaluate_zone_risk, generate_zone_alerts
    from backend.app.ml.model import predict_water_level

router = APIRouter(prefix="/alerts", tags=["Emergency Flood Alerts"])


class FloodAlert(BaseModel):
    id: str
    timestamp: str
    severity: str
    zone_id: str
    zone_name: str
    title: str
    message: str
    action: str
    priority: Optional[int] = 1
    time_to_critical_min: Optional[float] = None
    current_depth_cm: Optional[float] = None


@router.get("", response_model=List[FloodAlert])
def get_active_alerts():
    """
    Evaluates live telemetry and XGBoost forecasts across all urban flood zones
    to generate real-time early warnings, time-to-critical countdowns, and action plans.
    """
    sim_status = simulator.get_status()
    rainfall = sim_status.get("rainfall_1h_mm", 0.0)
    soil_sat = sim_status.get("soil_saturation_pct", 50.0)

    risk_profiles = []
    for z in sim_status.get("zones", []):
        zid = z["zone_id"]
        depth = z["water_depth_cm"]
        rise = z["rise_rate_cm_per_min"]
        elevation = z["elevation_m"]

        ml_res = predict_water_level({
            "rainfall_1h_mm": rainfall,
            "current_water_level_cm": depth,
            "water_rise_rate_cm_per_min": rise,
            "elevation_m": elevation,
            "soil_saturation_pct": soil_sat
        })

        eval_res = evaluate_zone_risk(
            zone_id=zid,
            current_depth_cm=depth,
            predicted_30m_cm=ml_res["predicted_depth_30m_cm"],
            predicted_60m_cm=ml_res["predicted_depth_60m_cm"],
            rise_rate_cm_per_min=rise,
            elevation_m=elevation
        )
        eval_res["name"] = z.get("name", zid)
        risk_profiles.append(eval_res)

    alerts = generate_zone_alerts(risk_profiles)
    return [FloodAlert(**a) for a in alerts]
