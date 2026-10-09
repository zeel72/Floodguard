from fastapi import APIRouter
from typing import List

try:
    from app.schemas.prediction import (
        PredictionRequest, 
        PredictionResponse, 
        PredictionFactor,
        ZonePrediction
    )
    from app.config import settings
    from app.ml.model import predict_water_level
    from app.core.simulator import simulator
except ImportError:
    from backend.app.schemas.prediction import (
        PredictionRequest, 
        PredictionResponse, 
        PredictionFactor,
        ZonePrediction
    )
    from backend.app.config import settings
    from backend.app.ml.model import predict_water_level
    from backend.app.core.simulator import simulator

router = APIRouter(prefix="/predictions", tags=["Hydrological AI Predictions"])


@router.post("/predict", response_model=PredictionResponse)
def compute_prediction(req: PredictionRequest):
    """
    Compute 30-minute and 60-minute forward water depth forecasts using
    the trained dual-horizon XGBoost machine learning regressors.
    """
    raw_input = {
        "rainfall_1h_mm": req.rainfall_1h_mm,
        "current_water_level_cm": req.current_water_depth_cm,
        "water_rise_rate_cm_per_min": req.water_rise_rate_cm_per_min,
        "elevation_m": req.elevation_m,
        "drainage_capacity_index": req.drainage_capacity_index,
        "soil_saturation_pct": req.soil_saturation_pct
    }

    ml_result = predict_water_level(raw_input)

    factors = [
        PredictionFactor(
            feature_name=f["feature"],
            contribution_weight=f["impact_pct"] / 100.0,
            description=f"{f['label']}: {f['value']}"
        )
        for f in ml_result.get("factors", [])
    ]

    rec = "Reroute emergency transports away from low-lying basin" if ml_result["risk_level"] in ["HIGH", "CRITICAL"] else "Safe for standard emergency vehicle dispatch"

    return PredictionResponse(
        zone_id=req.zone_id,
        current_depth_cm=ml_result["current_water_level_cm"],
        predicted_depth_30m_cm=ml_result["predicted_depth_30m_cm"],
        predicted_depth_60m_cm=ml_result["predicted_depth_60m_cm"],
        risk_level=ml_result["risk_level"],
        submergence_probability_pct=ml_result["submergence_probability_pct"],
        time_to_critical_min=ml_result["time_to_critical_min"],
        model_version=f"xgboost-v1 ({ml_result['engine']})",
        top_factors=factors,
        recommendation=rec
    )


@router.get("", response_model=List[ZonePrediction])
def get_all_zone_predictions():
    """
    Retrieve real-time 30m and 60m XGBoost forecasts across all monitored city zones.
    """
    state = simulator.get_status()
    rainfall = state["rainfall_1h_mm"]
    soil_sat = state["soil_saturation_pct"]
    predictions = []

    for z in state["zones"]:
        ml_res = predict_water_level({
            "rainfall_1h_mm": rainfall,
            "current_water_level_cm": z["water_depth_cm"],
            "water_rise_rate_cm_per_min": z["rise_rate_cm_per_min"],
            "elevation_m": z["elevation_m"],
            "soil_saturation_pct": soil_sat
        })

        predictions.append(ZonePrediction(
            zone_id=z["zone_id"],
            zone_name=z["name"],
            current_depth_cm=z["water_depth_cm"],
            predicted_depth_30m_cm=ml_res["predicted_depth_30m_cm"],
            predicted_depth_60m_cm=ml_res["predicted_depth_60m_cm"],
            risk_level=ml_res["risk_level"],
            time_to_critical_min=ml_res["time_to_critical_min"],
            submergence_probability_pct=ml_res["submergence_probability_pct"],
            elevation_m=z["elevation_m"],
            sensor_id=z["sensor_id"]
        ))

    return predictions
