from typing import List, Optional, Literal, Tuple
from pydantic import BaseModel, Field


class RouteRequest(BaseModel):
    origin: str = Field(..., description="Starting landmark or lat,lng", example="Ambulance Bay #4")
    destination: str = Field(..., description="Target trauma center or lat,lng", example="St. Jude Trauma Emergency Hospital")
    origin_coords: Optional[Tuple[float, float]] = Field(None, example=(19.0680, 72.8910))
    destination_coords: Optional[Tuple[float, float]] = Field(None, example=(19.0880, 72.9020))
    vehicle_type: Optional[str] = Field("ambulance", example="ambulance")
    max_tolerable_depth_cm: Optional[float] = Field(50.0, description="Max depth vehicle can ford through")


class RouteLeg(BaseModel):
    distance_km: float
    eta_min: float
    max_flood_depth_cm: float
    passability: Literal["CLEAR & SAFE", "CAUTION", "BLOCKED"]
    danger_level: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]
    waypoints: List[List[float]] = Field(default_factory=list)
    narrative: str


class RouteResponse(BaseModel):
    standard_shortest_route: RouteLeg
    safe_flood_avoidance_route: RouteLeg
    detour_distance_km: float
    detour_time_min: float
    risk_reduction_pct: float
    recommended_route_type: Literal["safe", "standard"]
