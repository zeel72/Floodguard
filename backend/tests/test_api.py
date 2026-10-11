import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)


def test_root_and_health():
    """Verify system root and health endpoints return 200 with online status."""
    root_res = client.get("/")
    assert root_res.status_code == 200
    data = root_res.json()
    assert data["status"] == "online"
    assert "version" in data

    health_res = client.get("/health")
    assert health_res.status_code == 200
    h_data = health_res.json()
    assert h_data["status"] == "ok"
    assert "aws_connected" in h_data


def test_aws_status():
    """Verify AWS status inspection endpoint returns service breakdown."""
    res = client.get("/api/v1/aws/status")
    assert res.status_code == 200
    data = res.json()
    assert "services" in data
    assert "dynamodb" in data["services"]
    assert "s3" in data["services"]


def test_simulation_workflow():
    """Verify setting scenario presets, manual rainfall adjustment, and time tick."""
    # 1. Set to dry
    res = client.post("/api/v1/simulation/scenario", json={"scenario": "dry"})
    assert res.status_code == 200
    data = res.json()
    assert data["scenario"] == "dry"
    assert data["rainfall_1h_mm"] >= 0.0

    # 2. Advance tick
    tick_res = client.post("/api/v1/simulation/tick", json={"minutes": 5})
    assert tick_res.status_code == 200
    assert tick_res.json()["minutes_advanced"] == 5

    # 3. Adjust rainfall
    rain_res = client.post("/api/v1/simulation/rainfall", json={"rainfall_1h_mm": 110.0})
    assert rain_res.status_code == 200
    assert rain_res.json()["rainfall_1h_mm"] == 110.0

    # 4. Read status
    status_res = client.get("/api/v1/simulation/status")
    assert status_res.status_code == 200
    s_data = status_res.json()
    assert "zones" in s_data
    assert len(s_data["zones"]) >= 5


def test_zones_geojson():
    """Verify GeoJSON endpoint returns valid FeatureCollection with polygon geometries."""
    res = client.get("/api/v1/zones")
    assert res.status_code == 200
    data = res.json()
    assert data.get("type") == "FeatureCollection"
    assert len(data.get("features", [])) >= 5
    first = data["features"][0]
    assert "properties" in first
    assert "risk_level" in first["properties"]
    assert "current_depth_cm" in first["properties"]


def test_sensor_telemetry_post():
    """Verify HC-SR04 ultrasonic sensor ingest accepts telemetry and processes depth."""
    payload = {
        "sensor_id": "SN-US-01",
        "zone_id": "ZONE_C_UNDERPASS",
        "water_depth_cm": 75.0,
        "raw_distance_cm": 125.0,
        "rainfall_1h_mm": 45.0,
        "water_rise_rate_cm_per_min": 1.2,
        "battery_pct": 94.0
    }
    res = client.post("/api/v1/sensor-data", json=payload)
    assert res.status_code in [200, 201]
    data = res.json()
    assert "water_depth_cm" in data
    assert data["water_depth_cm"] == 75.0


def test_routing_nodes_and_path():
    """Verify routing navigation nodes retrieval and A* dual-route solving."""
    # 1. Nodes catalog
    nodes_res = client.get("/api/v1/route/nodes")
    assert nodes_res.status_code == 200
    nodes_list = nodes_res.json()
    assert isinstance(nodes_list, list)
    assert len(nodes_list) >= 10

    # 2. Plan Route
    route_req = {
        "origin": "NODE_AMBULANCE_DEPOT",
        "destination": "NODE_METRO_HOSPITAL"
    }
    route_res = client.post("/api/v1/route", json=route_req)
    assert route_res.status_code == 200
    r_data = route_res.json()
    assert "safe_flood_avoidance_route" in r_data
    assert "standard_shortest_route" in r_data
    assert len(r_data["safe_flood_avoidance_route"]["waypoints"]) >= 2


def test_alerts_endpoint():
    """Verify early warning alert feed returns actionable advisories."""
    res = client.get("/api/v1/alerts")
    assert res.status_code == 200
    alerts = res.json()
    assert isinstance(alerts, list)


def test_ml_prediction_endpoint():
    """Verify XGBoost prediction endpoint returns 30m and 60m forecasts with SHAP factors."""
    req_payload = {
        "zone_id": "ZONE_C",
        "rainfall_1h_mm": 85.0,
        "current_water_depth_cm": 65.0,
        "water_rise_rate_cm_per_min": 2.5,
        "elevation_m": 8.0,
        "drainage_capacity_index": 0.2,
        "soil_saturation_pct": 90.0
    }
    res = client.post("/api/v1/predictions/predict", json=req_payload)
    assert res.status_code == 200
    data = res.json()
    assert "predicted_depth_30m_cm" in data
    assert "predicted_depth_60m_cm" in data
    assert data["predicted_depth_30m_cm"] > 0
    assert "top_factors" in data
