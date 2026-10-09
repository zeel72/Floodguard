from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/zones", tags=["Flood Zones & GeoJSON"])

MOCK_ZONES_GEOJSON: Dict[str, Any] = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "zone_id": "ZONE_B",
                "name": "Central Railway Underpass",
                "risk_level": "CRITICAL",
                "current_depth_cm": 78.4,
                "elevation_m": 6.2
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [72.8750, 19.0740],
                        [72.8800, 19.0740],
                        [72.8800, 19.0780],
                        [72.8750, 19.0780],
                        [72.8750, 19.0740]
                    ]
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "zone_id": "ZONE_C",
                "name": "Mahim Creek Culvert Basin",
                "risk_level": "HIGH",
                "current_depth_cm": 64.2,
                "elevation_m": 7.1
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [72.8660, 19.0800],
                        [72.8720, 19.0800],
                        [72.8720, 19.0840],
                        [72.8660, 19.0840],
                        [72.8660, 19.0800]
                    ]
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "zone_id": "ZONE_E",
                "name": "Hospital Medical Corridor",
                "risk_level": "LOW",
                "current_depth_cm": 22.5,
                "elevation_m": 16.8
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [72.8880, 19.0660],
                        [72.8940, 19.0660],
                        [72.8940, 19.0700],
                        [72.8880, 19.0700],
                        [72.8880, 19.0660]
                    ]
                ]
            }
        }
    ]
}


@router.get("")
def get_zones_geojson():
    """Returns GeoJSON FeatureCollection of urban flood zones and active risk metadata."""
    return MOCK_ZONES_GEOJSON
