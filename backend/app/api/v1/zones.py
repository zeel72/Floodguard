from fastapi import APIRouter
from typing import Dict, Any, List

try:
    from app.core.simulator import simulator
    from app.core.flood_engine import evaluate_zone_risk, get_risk_color
    from app.ml.model import predict_water_level
except ImportError:
    from backend.app.core.simulator import simulator
    from backend.app.core.flood_engine import evaluate_zone_risk, get_risk_color
    from backend.app.ml.model import predict_water_level

router = APIRouter(prefix="/zones", tags=["Flood Zones & GeoJSON"])

# Municipal GeoJSON Polygon Coordinates for Mumbai Urban Zones
ZONE_POLYGONS: Dict[str, List[List[float]]] = {
    "ZONE_B": [
        # Central Railway Underpass (Basin)
        [72.8730, 19.0730],
        [72.8820, 19.0730],
        [72.8820, 19.0790],
        [72.8730, 19.0790],
        [72.8730, 19.0730]
    ],
    "ZONE_C": [
        # Mahim Creek Culvert Basin (Riverfront)
        [72.8640, 19.0790],
        [72.8730, 19.0790],
        [72.8730, 19.0860],
        [72.8640, 19.0860],
        [72.8640, 19.0790]
    ],
    "ZONE_F": [
        # Lowland Residential Sector 4
        [72.8680, 19.0560],
        [72.8770, 19.0560],
        [72.8770, 19.0640],
        [72.8680, 19.0640],
        [72.8680, 19.0560]
    ],
    "ZONE_D": [
        # Metro Station North Plaza (Commercial)
        [72.8810, 19.0870],
        [72.8900, 19.0870],
        [72.8900, 19.0950],
        [72.8810, 19.0950],
        [72.8810, 19.0870]
    ],
    "ZONE_E": [
        # Hospital Medical Corridor (Trauma Center)
        [72.8860, 19.0640],
        [72.8960, 19.0640],
        [72.8960, 19.0720],
        [72.8860, 19.0720],
        [72.8860, 19.0640]
    ],
    "ZONE_A": [
        # Eastern Ridge Highground (Express Flyover)
        [72.8970, 19.0830],
        [72.9070, 19.0830],
        [72.9070, 19.0930],
        [72.8970, 19.0930],
        [72.8970, 19.0830]
    ]
}


@router.get("")
def get_zones_geojson():
    """
    Returns dynamic GeoJSON FeatureCollection of all urban flood zones.
    Each zone feature properties are updated in real-time with live depth,
    XGBoost 30m/60m projections, risk classifications, and A* road penalties.
    """
    sim_state = simulator.get_status()
    rainfall = sim_state["rainfall_1h_mm"]
    soil_sat = sim_state["soil_saturation_pct"]

    features = []
    for z in sim_state["zones"]:
        zone_id = z["zone_id"]
        
        # Calculate ML predictions for zone
        ml_res = predict_water_level({
            "rainfall_1h_mm": rainfall,
            "current_water_level_cm": z["water_depth_cm"],
            "water_rise_rate_cm_per_min": z["rise_rate_cm_per_min"],
            "elevation_m": z["elevation_m"],
            "soil_saturation_pct": soil_sat
        })

        # Evaluate comprehensive risk profile
        risk_profile = evaluate_zone_risk(
            zone_id=zone_id,
            current_depth_cm=z["water_depth_cm"],
            predicted_30m_cm=ml_res["predicted_depth_30m_cm"],
            predicted_60m_cm=ml_res["predicted_depth_60m_cm"],
            rise_rate_cm_per_min=z["rise_rate_cm_per_min"],
            elevation_m=z["elevation_m"]
        )

        polygon_coords = ZONE_POLYGONS.get(zone_id, [
            [
                [z["lng"] - 0.005, z["lat"] - 0.005],
                [z["lng"] + 0.005, z["lat"] - 0.005],
                [z["lng"] + 0.005, z["lat"] + 0.005],
                [z["lng"] - 0.005, z["lat"] + 0.005],
                [z["lng"] - 0.005, z["lat"] - 0.005]
            ]
        ])

        feature = {
            "type": "Feature",
            "id": zone_id,
            "properties": {
                "zone_id": zone_id,
                "name": z["name"],
                "sensor_id": z["sensor_id"],
                "elevation_m": z["elevation_m"],
                "current_depth_cm": risk_profile["current_depth_cm"],
                "predicted_depth_30m_cm": risk_profile["predicted_depth_30m_cm"],
                "predicted_depth_60m_cm": risk_profile["predicted_depth_60m_cm"],
                "water_rise_rate_cm_per_min": risk_profile["water_rise_rate_cm_per_min"],
                "risk_level": risk_profile["risk_level"],
                "color_hex": risk_profile["color_hex"],
                "time_to_critical_min": risk_profile["time_to_critical_min"],
                "flood_risk_index": risk_profile["flood_risk_index"],
                "flood_probability": risk_profile["flood_probability"],
                "road_penalty_multiplier": risk_profile["road_penalty_multiplier"],
                "latitude": z["lat"],
                "longitude": z["lng"]
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [polygon_coords]
            }
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "metadata": {
            "city": "Mumbai Metropolitan Region",
            "active_preset": sim_state["active_preset"],
            "rainfall_1h_mm": rainfall,
            "total_zones": len(features),
            "timestamp": sim_state["timestamp"]
        },
        "features": features
    }
