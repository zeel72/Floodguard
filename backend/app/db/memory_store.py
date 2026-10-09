import threading
import time
from typing import Dict, List, Optional, Any


class MemoryStore:
    """
    Thread-safe In-Memory Store
    Provides transparent local CRUD operations mimicking DynamoDB partition/sort key semantics
    for offline development, tests, and zero-hardware hackathon demonstrations.
    """

    def __init__(self):
        self._lock = threading.Lock()
        # sensor_id -> list of reading dicts sorted by timestamp descending
        self._readings: Dict[str, List[Dict[str, Any]]] = {}
        # zone_id -> zone dict
        self._zones: Dict[str, Dict[str, Any]] = {}
        # sensor_id -> latest sensor metadata
        self._sensors: Dict[str, Dict[str, Any]] = {}
        self._seed_initial_data()

    def _seed_initial_data(self):
        """Seed initial urban zones and sensors."""
        now_ms = int(time.time() * 1000)
        initial_zones = [
            {
                "zone_id": "ZONE_B",
                "name": "Central Railway Underpass",
                "elevation_m": 6.2,
                "drainage_capacity_index": 0.35,
                "current_water_depth_cm": 68.0,
                "risk_level": "HIGH",
                "latitude": 19.0760,
                "longitude": 72.8777,
                "sensor_id": "SN-101",
                "updated_at": now_ms
            },
            {
                "zone_id": "ZONE_C",
                "name": "Mahim Creek Culvert Basin",
                "elevation_m": 7.1,
                "drainage_capacity_index": 0.40,
                "current_water_depth_cm": 52.0,
                "risk_level": "MODERATE",
                "latitude": 19.0820,
                "longitude": 72.8690,
                "sensor_id": "SN-102",
                "updated_at": now_ms
            },
            {
                "zone_id": "ZONE_D",
                "name": "Metro Station North Plaza",
                "elevation_m": 12.5,
                "drainage_capacity_index": 0.70,
                "current_water_depth_cm": 32.0,
                "risk_level": "LOW",
                "latitude": 19.0910,
                "longitude": 72.8850,
                "sensor_id": "SN-103",
                "updated_at": now_ms
            },
            {
                "zone_id": "ZONE_E",
                "name": "Hospital Medical Corridor",
                "elevation_m": 16.8,
                "drainage_capacity_index": 0.85,
                "current_water_depth_cm": 18.0,
                "risk_level": "LOW",
                "latitude": 19.0680,
                "longitude": 72.8910,
                "sensor_id": "SN-104",
                "updated_at": now_ms
            }
        ]
        for z in initial_zones:
            self._zones[z["zone_id"]] = z
            self._sensors[z["sensor_id"]] = {
                "sensor_id": z["sensor_id"],
                "name": z["name"],
                "zone_id": z["zone_id"],
                "zone_name": z["name"],
                "latitude": z["latitude"],
                "longitude": z["longitude"],
                "elevation_m": z["elevation_m"],
                "current_depth_cm": z["current_water_depth_cm"],
                "water_rise_rate_cm_per_min": 2.5 if z["zone_id"] == "ZONE_B" else 0.5,
                "battery_pct": 95.0,
                "status": "ONLINE",
                "risk_level": z["risk_level"],
                "last_seen_ms": now_ms
            }

    def save_sensor_reading(self, reading: Dict[str, Any]) -> Dict[str, Any]:
        """Save a new telemetry reading packet."""
        with self._lock:
            sensor_id = reading["sensor_id"]
            if sensor_id not in self._readings:
                self._readings[sensor_id] = []
            
            # Prepend or insert sorted by timestamp desc
            self._readings[sensor_id].insert(0, reading)
            # Cap reading history to latest 500 per sensor
            if len(self._readings[sensor_id]) > 500:
                self._readings[sensor_id] = self._readings[sensor_id][:500]

            # Update latest sensor state with fallback defaults
            prev = self._sensors.get(sensor_id, {})
            self._sensors[sensor_id] = {
                "sensor_id": sensor_id,
                "name": reading.get("name") or prev.get("name") or f"Sensor Node {sensor_id}",
                "zone_id": reading.get("zone_id") or prev.get("zone_id") or "ZONE_GENERAL",
                "zone_name": prev.get("zone_name") or f"Sector {sensor_id}",
                "latitude": reading.get("latitude") if reading.get("latitude") is not None else prev.get("latitude", 19.0760),
                "longitude": reading.get("longitude") if reading.get("longitude") is not None else prev.get("longitude", 72.8777),
                "elevation_m": reading.get("elevation_m") if reading.get("elevation_m") is not None else prev.get("elevation_m", 10.0),
                "current_depth_cm": reading["water_depth_cm"],
                "water_rise_rate_cm_per_min": reading.get("water_rise_rate_cm_per_min", 0.0),
                "battery_pct": reading.get("battery_pct", 100.0),
                "status": "ONLINE",
                "risk_level": reading.get("risk_level", "LOW"),
                "last_seen_ms": reading.get("timestamp", int(time.time() * 1000))
            }

            return reading

    def get_sensor_readings(self, sensor_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieve latest N readings for a sensor."""
        with self._lock:
            readings = self._readings.get(sensor_id, [])
            return readings[:limit]

    def list_all_sensors(self) -> List[Dict[str, Any]]:
        """Retrieve all registered sensor nodes and their latest readings."""
        with self._lock:
            return list(self._sensors.values())

    def save_zone(self, zone_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save or update zone record."""
        with self._lock:
            zone_id = zone_data["zone_id"]
            zone_data["updated_at"] = zone_data.get("updated_at", int(time.time() * 1000))
            self._zones[zone_id] = zone_data
            return zone_data

    def get_zone(self, zone_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._zones.get(zone_id)

    def list_all_zones(self) -> List[Dict[str, Any]]:
        with self._lock:
            return list(self._zones.values())


# Global singleton instance
memory_store = MemoryStore()
