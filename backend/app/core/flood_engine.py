import math
from typing import Dict, Any, Optional

try:
    from app.config import settings
except ImportError:
    from backend.app.config import settings


def classify_risk(water_level_cm: float, custom_thresholds: Optional[Dict[str, float]] = None) -> str:
    """
    Classify road water depth into standardized municipal flood danger categories:
      - < 50 cm:  LOW (Green - Safe passage for all vehicles)
      - 50-70 cm: MODERATE (Yellow - Low-clearance vehicles prohibited)
      - 70-90 cm: HIGH (Orange - Emergency heavy vehicles only, prepare diversion)
      - >= 90 cm: CRITICAL (Red - Impassable, total submergence hazard)
    """
    water_level = max(0.0, float(water_level_cm))
    mod_thresh = custom_thresholds.get("MODERATE", settings.MODERATE_WATER_DEPTH_CM) if custom_thresholds else settings.MODERATE_WATER_DEPTH_CM
    high_thresh = custom_thresholds.get("HIGH", settings.HIGH_WATER_DEPTH_CM) if custom_thresholds else settings.HIGH_WATER_DEPTH_CM
    crit_thresh = custom_thresholds.get("CRITICAL", settings.CRITICAL_WATER_DEPTH_CM) if custom_thresholds else settings.CRITICAL_WATER_DEPTH_CM

    if water_level >= crit_thresh:
        return "CRITICAL"
    elif water_level >= high_thresh:
        return "HIGH"
    elif water_level >= mod_thresh:
        return "MODERATE"
    return "LOW"


def get_risk_color(risk_level: str) -> str:
    """Return standard UI/GIS hex color token for given risk level."""
    colors = {
        "CRITICAL": "#ef4444", # Crimson Neon
        "HIGH": "#f59e0b",     # Amber Orange
        "MODERATE": "#eab308", # Goldenrod Yellow
        "LOW": "#10b981"       # Emerald Green
    }
    return colors.get(risk_level.upper(), "#10b981")


def get_road_penalty_multiplier(risk_level: str) -> float:
    """
    Return routing graph edge cost penalty multiplier for A* Dijkstra router:
      - LOW: Normal travel cost
      - MODERATE: 2.5x travel time cost penalty
      - HIGH: 12.0x severe diversion penalty
      - CRITICAL: 1000.0x impassable obstacle (complete avoidance)
    """
    multipliers = {
        "LOW": 1.0,
        "MODERATE": 2.5,
        "HIGH": 12.0,
        "CRITICAL": 1000.0
    }
    return multipliers.get(risk_level.upper(), 1.0)


def calculate_time_to_critical(
    current_depth_cm: float, 
    rise_rate_cm_per_min: float, 
    critical_threshold_cm: float = 90.0
) -> Optional[float]:
    """
    Compute estimated Time to Critical Submergence (T_crit) in minutes.
    Formula: (90.0 - W_curr) / rise_rate.
    Guards:
      - Returns 0.0 if already at or above critical threshold.
      - Returns None if water rise rate is zero or receding (no imminent danger).
    """
    if current_depth_cm >= critical_threshold_cm:
        return 0.0
    if rise_rate_cm_per_min <= 0.0001:
        return None

    time_mins = (critical_threshold_cm - current_depth_cm) / rise_rate_cm_per_min
    return round(max(0.0, time_mins), 1)


def calculate_fri(
    current_depth_cm: float,
    predicted_60m_cm: float,
    rise_rate_cm_per_min: float,
    elevation_m: float = 10.0,
    drainage_capacity_index: float = 0.5
) -> float:
    """
    Compute normalized Flood Risk Index (FRI) between 0.0 and 1.0.
    Weighted combination of current depth (40%), 60-min AI projection (35%),
    velocity of rise (15%), and topographical vulnerability (10%).
    """
    depth_comp = min(max(current_depth_cm, 0.0) / 100.0, 1.0) * 0.40
    proj_comp = min(max(predicted_60m_cm, 0.0) / 120.0, 1.0) * 0.35
    vel_comp = min(max(rise_rate_cm_per_min, 0.0) / 5.0, 1.0) * 0.15
    topo_comp = (max(20.0 - elevation_m, 0.0) / 20.0) * (1.0 - drainage_capacity_index * 0.5) * 0.10

    fri = depth_comp + proj_comp + vel_comp + topo_comp
    return round(float(min(max(fri, 0.0), 1.0)), 3)


def calculate_flood_probability(
    current_depth_cm: float,
    predicted_60m_cm: float,
    rise_rate_cm_per_min: float
) -> float:
    """
    Compute mathematical probability of road submergence (0.0 to 1.0)
    using a calibrated logistic sigmoid centered at 60 cm depth.
    """
    effective_depth = (current_depth_cm * 0.4) + (predicted_60m_cm * 0.6)
    # Sigmoid function centered at 60 cm, scaling width 18 cm
    z = (effective_depth - 60.0) / 18.0
    prob = 1.0 / (1.0 + math.exp(-z))
    return round(float(min(max(prob, 0.01), 0.99)), 3)


def evaluate_zone_risk(
    zone_id: str,
    current_depth_cm: float,
    predicted_30m_cm: float,
    predicted_60m_cm: float,
    rise_rate_cm_per_min: float,
    elevation_m: float,
    drainage_capacity_index: float = 0.5
) -> Dict[str, Any]:
    """
    Comprehensive multi-factor risk assessment evaluating depths,
    classification, FRI, time to critical, and routing penalties.
    """
    # Evaluate risk based on highest anticipated water height between current and projected
    risk = classify_risk(max(current_depth_cm, predicted_60m_cm * 0.85))
    color = get_risk_color(risk)
    penalty = get_road_penalty_multiplier(risk)
    time_to_crit = calculate_time_to_critical(current_depth_cm, rise_rate_cm_per_min)
    fri = calculate_fri(current_depth_cm, predicted_60m_cm, rise_rate_cm_per_min, elevation_m, drainage_capacity_index)
    prob = calculate_flood_probability(current_depth_cm, predicted_60m_cm, rise_rate_cm_per_min)

    return {
        "zone_id": zone_id,
        "risk_level": risk,
        "color_hex": color,
        "current_depth_cm": round(current_depth_cm, 1),
        "predicted_depth_30m_cm": round(predicted_30m_cm, 1),
        "predicted_depth_60m_cm": round(predicted_60m_cm, 1),
        "water_rise_rate_cm_per_min": round(rise_rate_cm_per_min, 2),
        "time_to_critical_min": time_to_crit,
        "flood_risk_index": fri,
        "flood_probability": prob,
        "road_penalty_multiplier": penalty,
        "elevation_m": elevation_m
    }
