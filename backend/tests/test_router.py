import os
import sys
import pytest

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.router import SafeRouter, haversine_km, safe_router
from app.core.simulator import simulator


def test_haversine_km():
    """Verify spherical distance calculation between known coordinates."""
    dist = haversine_km(12.9716, 77.5946, 12.9800, 77.6000)
    assert 1.0 < dist < 1.5

    assert haversine_km(12.9716, 77.5946, 12.9716, 77.5946) == 0.0


def test_safe_router_graph_loaded():
    """Verify city road graph loaded correctly with expected nodes and edges."""
    assert len(safe_router.nodes) >= 10
    assert "NODE_AMBULANCE_DEPOT" in safe_router.nodes
    assert "NODE_METRO_HOSPITAL" in safe_router.nodes
    assert "NODE_CENTRAL_UNDERPASS" in safe_router.nodes
    assert len(safe_router.adjacency) >= 10


def test_safe_router_dry_conditions():
    """Under dry conditions, safe route and standard shortest route should both succeed."""
    simulator.set_scenario("dry")
    result = safe_router.plan_dual_route(
        origin_id="NODE_AMBULANCE_DEPOT",
        destination_id="NODE_METRO_HOSPITAL"
    )
    assert "standard_shortest_route" in result
    assert "safe_flood_avoidance_route" in result
    assert result["standard_shortest_route"]["distance_km"] > 0
    assert result["safe_flood_avoidance_route"]["distance_km"] > 0


def test_safe_router_diversion_during_flash_flood():
    """
    During a flash flood scenario where the low-lying underpass is inundated,
    the safe route must divert away or show lower or equal flood risk.
    """
    simulator.set_scenario("flash_flood")
    result = safe_router.plan_dual_route(
        origin_id="NODE_AMBULANCE_DEPOT",
        destination_id="NODE_METRO_HOSPITAL"
    )
    std = result["standard_shortest_route"]
    safe = result["safe_flood_avoidance_route"]

    # Safe route should have lower or equal max flood depth
    assert safe["max_flood_depth_cm"] <= std["max_flood_depth_cm"]
    assert "risk_reduction_pct" in result
    assert result["risk_reduction_pct"] >= 0


def test_safe_router_edge_cases():
    """Verify safe router handles node queries gracefully."""
    # When given unknown node query, defaults to safe known coordinates
    result = safe_router.plan_dual_route(
        origin_id="NON_EXISTENT_ORIGIN",
        destination_id="NODE_METRO_HOSPITAL"
    )
    assert "safe_flood_avoidance_route" in result
    assert result["safe_flood_avoidance_route"]["distance_km"] > 0
