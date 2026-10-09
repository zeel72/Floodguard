import sys
import os
import pytest

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.flood_engine import (
    classify_risk,
    get_risk_color,
    get_road_penalty_multiplier,
    calculate_time_to_critical,
    calculate_fri,
    calculate_flood_probability,
    evaluate_zone_risk
)


def test_classify_risk_standard():
    """Verify standard risk level categorization."""
    assert classify_risk(45.0) == "LOW"
    assert classify_risk(55.0) == "MODERATE"
    assert classify_risk(75.0) == "HIGH"
    assert classify_risk(95.0) == "CRITICAL"


def test_classify_risk_boundary_conditions():
    """Verify exact threshold boundary transitions."""
    # Low to Moderate boundary (50.0 cm)
    assert classify_risk(49.9) == "LOW"
    assert classify_risk(50.0) == "MODERATE"

    # Moderate to High boundary (70.0 cm)
    assert classify_risk(69.9) == "MODERATE"
    assert classify_risk(70.0) == "HIGH"

    # High to Critical boundary (90.0 cm)
    assert classify_risk(89.9) == "HIGH"
    assert classify_risk(90.0) == "CRITICAL"

    # Negative values clamped safely
    assert classify_risk(-10.0) == "LOW"
    assert classify_risk(0.0) == "LOW"

    # Extreme values
    assert classify_risk(250.0) == "CRITICAL"


def test_time_to_critical():
    """Verify T_crit formula and division by zero guards."""
    # Normal rising condition: (90 - 60) / 3.0 = 10.0 mins
    assert calculate_time_to_critical(current_depth_cm=60.0, rise_rate_cm_per_min=3.0) == 10.0
    
    # Rising at +4.5 cm/min from 45cm: (90 - 45) / 4.5 = 10.0 mins
    assert calculate_time_to_critical(current_depth_cm=45.0, rise_rate_cm_per_min=4.5) == 10.0

    # Already critical or breached (>= 90 cm)
    assert calculate_time_to_critical(current_depth_cm=90.0, rise_rate_cm_per_min=2.0) == 0.0
    assert calculate_time_to_critical(current_depth_cm=110.0, rise_rate_cm_per_min=2.0) == 0.0

    # Zero or receding water rise rate should return None (no imminent breach)
    assert calculate_time_to_critical(current_depth_cm=40.0, rise_rate_cm_per_min=0.0) is None
    assert calculate_time_to_critical(current_depth_cm=40.0, rise_rate_cm_per_min=-1.5) is None


def test_flood_risk_index_bounds():
    """Verify FRI stays strictly within [0.0, 1.0]."""
    fri_dry = calculate_fri(current_depth_cm=2.0, predicted_60m_cm=5.0, rise_rate_cm_per_min=0.0, elevation_m=19.2)
    assert 0.0 <= fri_dry <= 0.25

    fri_extreme = calculate_fri(current_depth_cm=150.0, predicted_60m_cm=200.0, rise_rate_cm_per_min=6.0, elevation_m=6.0)
    assert 0.85 <= fri_extreme <= 1.0


def test_flood_probability_bounds():
    """Verify probability returns a sigmoid score in [0.0, 1.0]."""
    prob_low = calculate_flood_probability(current_depth_cm=10.0, predicted_60m_cm=15.0, rise_rate_cm_per_min=0.0)
    assert 0.0 < prob_low < 0.20

    prob_high = calculate_flood_probability(current_depth_cm=85.0, predicted_60m_cm=120.0, rise_rate_cm_per_min=3.0)
    assert 0.80 < prob_high < 1.0


def test_risk_colors_and_penalties():
    """Verify colors and A* edge penalty multipliers."""
    assert get_risk_color("LOW") == "#10b981"
    assert get_risk_color("MODERATE") == "#eab308"
    assert get_risk_color("HIGH") == "#f59e0b"
    assert get_risk_color("CRITICAL") == "#ef4444"

    assert get_road_penalty_multiplier("LOW") == 1.0
    assert get_road_penalty_multiplier("MODERATE") == 2.5
    assert get_road_penalty_multiplier("HIGH") == 12.0
    assert get_road_penalty_multiplier("CRITICAL") == 1000.0


def test_evaluate_zone_risk_integration():
    """Verify end-to-end zone risk evaluation dictionary."""
    res = evaluate_zone_risk(
        zone_id="ZONE_B",
        current_depth_cm=78.4,
        predicted_30m_cm=95.0,
        predicted_60m_cm=125.0,
        rise_rate_cm_per_min=3.8,
        elevation_m=6.2,
        drainage_capacity_index=0.35
    )
    assert res["zone_id"] == "ZONE_B"
    assert res["risk_level"] == "CRITICAL"
    assert res["color_hex"] == "#ef4444"
    assert res["road_penalty_multiplier"] == 1000.0
    assert res["time_to_critical_min"] is not None
    assert res["time_to_critical_min"] > 0
    assert 0.0 <= res["flood_risk_index"] <= 1.0
