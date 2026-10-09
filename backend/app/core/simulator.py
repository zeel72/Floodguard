import time
import random
from typing import Dict, List, Any, Optional

class SimulatorEngine:
    """
    Autonomous Hydrological Simulation Engine
    Simulates urban rainfall-runoff dynamics, elevation-based catchment accumulation,
    and drainage discharge physics without requiring hardware or active cloud connection.
    """

    PRESETS = {
        "dry": {
            "name": "Dry / Controlled Baseline",
            "rainfall_mm": 2.0,
            "soil_saturation_pct": 15.0,
            "description": "Clear skies with normal street conditions. Drains operating at baseline."
        },
        "moderate_rain": {
            "name": "Moderate Monsoon Shower",
            "rainfall_mm": 35.0,
            "soil_saturation_pct": 55.0,
            "description": "Steady monsoon rain with minor gutter pooling in depressions."
        },
        "flash_flood": {
            "name": "Flash Flood Inundation",
            "rainfall_mm": 95.0,
            "soil_saturation_pct": 88.0,
            "description": "Rapid intense cloudburst overwhelming underpasses and low-lying culverts."
        },
        "cloudburst": {
            "name": "Severe Cloudburst Crisis",
            "rainfall_mm": 140.0,
            "soil_saturation_pct": 98.0,
            "description": "Extreme catastrophic storm event with citywide runoff chokepoints."
        }
    }

    def __init__(self):
        self.active_preset: str = "flash_flood"
        self.rainfall_1h_mm: float = self.PRESETS["flash_flood"]["rainfall_mm"]
        self.soil_saturation_pct: float = self.PRESETS["flash_flood"]["soil_saturation_pct"]
        self.simulated_minutes_elapsed: int = 0
        self.last_tick_time: float = time.time()
        
        # Zone topography & hydrological specifications
        # Elevation is in meters. Lower elevation attracts higher gravitational runoff.
        self.zones: Dict[str, Dict[str, Any]] = {
            "ZONE_B": {
                "name": "Central Railway Underpass",
                "sensor_id": "SN-101",
                "elevation_m": 6.2,
                "drainage_capacity": 0.35, # Low capacity = slow discharge
                "catchment_multiplier": 1.6, # Depressed basin collects neighbor runoff
                "water_depth_cm": 68.0,
                "rise_rate_cm_per_min": 3.8,
                "lat": 19.0760,
                "lng": 72.8777
            },
            "ZONE_C": {
                "name": "Mahim Creek Culvert Basin",
                "sensor_id": "SN-102",
                "elevation_m": 7.1,
                "drainage_capacity": 0.40,
                "catchment_multiplier": 1.4,
                "water_depth_cm": 52.0,
                "rise_rate_cm_per_min": 2.6,
                "lat": 19.0820,
                "lng": 72.8690
            },
            "ZONE_F": {
                "name": "Lowland Residential Sector 4",
                "sensor_id": "SN-105",
                "elevation_m": 8.4,
                "drainage_capacity": 0.50,
                "catchment_multiplier": 1.2,
                "water_depth_cm": 44.0,
                "rise_rate_cm_per_min": 1.9,
                "lat": 19.0600,
                "lng": 72.8720
            },
            "ZONE_D": {
                "name": "Metro Station North Plaza",
                "sensor_id": "SN-103",
                "elevation_m": 12.5,
                "drainage_capacity": 0.70,
                "catchment_multiplier": 0.9,
                "water_depth_cm": 32.0,
                "rise_rate_cm_per_min": 1.1,
                "lat": 19.0910,
                "lng": 72.8850
            },
            "ZONE_E": {
                "name": "Hospital Medical Corridor",
                "sensor_id": "SN-104",
                "elevation_m": 16.8,
                "drainage_capacity": 0.85,
                "catchment_multiplier": 0.6,
                "water_depth_cm": 18.0,
                "rise_rate_cm_per_min": 0.3,
                "lat": 19.0680,
                "lng": 72.8910
            },
            "ZONE_A": {
                "name": "Eastern Ridge Highground",
                "sensor_id": "SN-106",
                "elevation_m": 19.2,
                "drainage_capacity": 0.95,
                "catchment_multiplier": 0.4,
                "water_depth_cm": 8.0,
                "rise_rate_cm_per_min": -0.1,
                "lat": 19.0880,
                "lng": 72.9020
            }
        }

    def set_scenario(self, scenario_key: str) -> Dict[str, Any]:
        """Switch simulation preset scenario and recalculate immediate rates."""
        if scenario_key not in self.PRESETS:
            scenario_key = "flash_flood"
        self.active_preset = scenario_key
        preset = self.PRESETS[scenario_key]
        self.rainfall_1h_mm = preset["rainfall_mm"]
        self.soil_saturation_pct = preset["soil_saturation_pct"]
        
        # Reset zone depths toward initial preset targets
        for zone_id, z in self.zones.items():
            elev_factor = max(20.0 - z["elevation_m"], 1.0) / 14.0
            drain_factor = 1.0 - z["drainage_capacity"]
            
            if scenario_key == "dry":
                z["water_depth_cm"] = max(z["water_depth_cm"] * 0.4, 2.0)
                z["rise_rate_cm_per_min"] = -0.5 * z["drainage_capacity"]
            elif scenario_key == "moderate_rain":
                z["water_depth_cm"] = round(15.0 + (elev_factor * 25.0 * drain_factor), 1)
                z["rise_rate_cm_per_min"] = round(0.4 + (elev_factor * drain_factor * 1.5), 2)
            elif scenario_key == "flash_flood":
                z["water_depth_cm"] = round(30.0 + (elev_factor * 48.0 * drain_factor), 1)
                z["rise_rate_cm_per_min"] = round(1.2 + (elev_factor * drain_factor * 3.4), 2)
            elif scenario_key == "cloudburst":
                z["water_depth_cm"] = round(45.0 + (elev_factor * 65.0 * drain_factor), 1)
                z["rise_rate_cm_per_min"] = round(2.0 + (elev_factor * drain_factor * 4.8), 2)

        return self.get_status()

    def set_rainfall(self, rainfall_mm: float) -> Dict[str, Any]:
        """Manually adjust rainfall intensity from UI slider."""
        self.rainfall_1h_mm = max(0.0, min(rainfall_mm, 200.0))
        # Update soil saturation smoothly based on rainfall
        self.soil_saturation_pct = min(100.0, max(10.0, 15.0 + (self.rainfall_1h_mm * 0.55)))
        
        # Update rise rates
        for zone_id, z in self.zones.items():
            inflow = (self.rainfall_1h_mm / 60.0) * z["catchment_multiplier"] * 3.2
            outflow = z["drainage_capacity"] * 1.8
            net_rate = inflow - outflow
            z["rise_rate_cm_per_min"] = round(net_rate, 2)

        return self.get_status()

    def tick(self, minutes: int = 3) -> Dict[str, Any]:
        """
        Advance simulation time forward by `minutes`.
        Calculates hydrological accumulation, drainage discharge, and updates depth.
        Clamps depth between 0.0 and 200.0 cm.
        """
        minutes = max(1, min(minutes, 60))
        self.simulated_minutes_elapsed += minutes
        self.last_tick_time = time.time()

        for zone_id, z in self.zones.items():
            # Inflow volume factor: rainfall intensity * catchment runoff multiplier
            # Lower elevation zones receive uphill runoff runoff accumulation
            elevation_gradient = max(20.0 - z["elevation_m"], 0.5) / 10.0
            saturation_factor = self.soil_saturation_pct / 100.0
            
            # Inflow rate (cm/min)
            inflow_rate = (self.rainfall_1h_mm / 60.0) * z["catchment_multiplier"] * elevation_gradient * (1.0 + saturation_factor)
            
            # Outflow rate (cm/min): dependent on storm drain capacity and current water pressure
            outflow_rate = z["drainage_capacity"] * 2.2 * (1.0 + (z["water_depth_cm"] / 100.0) * 0.5)
            
            net_rate = inflow_rate - outflow_rate
            z["rise_rate_cm_per_min"] = round(net_rate, 2)
            
            # Update water depth
            new_depth = z["water_depth_cm"] + (net_rate * minutes)
            # Add minor sensor jitter (+/- 0.2 cm) for realistic telemetry
            jitter = random.uniform(-0.15, 0.15)
            # Clamp between 0 and 200 cm
            z["water_depth_cm"] = round(max(0.0, min(new_depth + jitter, 200.0)), 1)

        return self.get_status()

    def get_status(self) -> Dict[str, Any]:
        """Compile complete current city state, per-zone telemetry, and risk evaluation."""
        total_depth = sum(z["water_depth_cm"] for z in self.zones.values())
        max_depth = max(z["water_depth_cm"] for z in self.zones.values())
        avg_depth = round(total_depth / len(self.zones), 1)
        
        # Determine citywide risk level based on max depth
        if max_depth >= 90.0:
            city_risk = "CRITICAL"
        elif max_depth >= 70.0:
            city_risk = "HIGH"
        elif max_depth >= 50.0:
            city_risk = "MODERATE"
        else:
            city_risk = "LOW"

        # Compute predicted depths (30m and 60m)
        predicted_30m = round(min(max_depth + (self.get_max_rise_rate() * 30 * 0.75), 200.0), 1)
        predicted_60m = round(min(max_depth + (self.get_max_rise_rate() * 60 * 0.65), 200.0), 1)

        zones_data = []
        for zone_id, z in self.zones.items():
            d = z["water_depth_cm"]
            if d >= 90.0:
                r = "CRITICAL"
            elif d >= 70.0:
                r = "HIGH"
            elif d >= 50.0:
                r = "MODERATE"
            else:
                r = "LOW"
            
            time_to_crit = None
            if z["rise_rate_cm_per_min"] > 0:
                dist = max(90.0 - d, 0.0)
                time_to_crit = round(dist / z["rise_rate_cm_per_min"], 1)

            zones_data.append({
                "zone_id": zone_id,
                "name": z["name"],
                "sensor_id": z["sensor_id"],
                "elevation_m": z["elevation_m"],
                "water_depth_cm": d,
                "rise_rate_cm_per_min": z["rise_rate_cm_per_min"],
                "risk_level": r,
                "time_to_critical_min": time_to_crit,
                "lat": z["lat"],
                "lng": z["lng"]
            })

        return {
            "active_preset": self.active_preset,
            "preset_details": self.PRESETS.get(self.active_preset, {}),
            "rainfall_1h_mm": round(self.rainfall_1h_mm, 1),
            "soil_saturation_pct": round(self.soil_saturation_pct, 1),
            "simulated_minutes_elapsed": self.simulated_minutes_elapsed,
            "city_risk_level": city_risk,
            "max_water_depth_cm": max_depth,
            "avg_water_depth_cm": avg_depth,
            "predicted_depth_30m_cm": predicted_30m,
            "predicted_depth_60m_cm": predicted_60m,
            "zones": zones_data,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

    def get_max_rise_rate(self) -> float:
        return max(z["rise_rate_cm_per_min"] for z in self.zones.values())


# Singleton simulator instance
simulator = SimulatorEngine()
