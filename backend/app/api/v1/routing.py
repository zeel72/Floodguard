from fastapi import APIRouter
from typing import List, Dict, Any

try:
    from app.schemas.route import RouteRequest, RouteResponse, RouteLeg
    from app.core.router import safe_router
except ImportError:
    from backend.app.schemas.route import RouteRequest, RouteResponse, RouteLeg
    from backend.app.core.router import safe_router

router = APIRouter(prefix="/route", tags=["SafeRoute Navigation Engine"])


@router.get("/nodes", response_model=List[Dict[str, Any]])
def get_routing_nodes():
    """
    Returns list of all available road network nodes, hospitals, depots,
    and transit intersections for route planning dropdown selection.
    """
    return safe_router.get_nodes_catalog()


@router.post("", response_model=RouteResponse)
def compute_safe_route(req: RouteRequest):
    """
    Computes standard shortest path vs flood-risk-penalized A* safe route
    for emergency responder navigation based on real-time and predicted water depths.
    """
    plan = safe_router.plan_dual_route(
        origin_id=req.origin,
        destination_id=req.destination,
        max_tolerable_depth_cm=req.max_tolerable_depth_cm or 50.0
    )

    standard = RouteLeg(**plan["standard_shortest_route"])
    safe = RouteLeg(**plan["safe_flood_avoidance_route"])

    return RouteResponse(
        standard_shortest_route=standard,
        safe_flood_avoidance_route=safe,
        detour_distance_km=plan["detour_distance_km"],
        detour_time_min=plan["detour_time_min"],
        risk_reduction_pct=plan["risk_reduction_pct"],
        recommended_route_type=plan["recommended_route_type"]
    )
