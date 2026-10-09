from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

try:
    from app.core.simulator import simulator
except ImportError:
    from backend.app.core.simulator import simulator

router = APIRouter(prefix="/simulation", tags=["Simulation Suite"])


class ScenarioRequest(BaseModel):
    scenario: str = Field(..., description="Preset: 'dry' | 'moderate_rain' | 'flash_flood' | 'cloudburst'", example="flash_flood")


class TickRequest(BaseModel):
    minutes: int = Field(default=3, ge=1, le=60, description="Number of minutes to advance simulation", example=3)


class RainfallRequest(BaseModel):
    rainfall_1h_mm: float = Field(..., ge=0.0, le=250.0, description="Manually adjusted precipitation in mm/h", example=85.0)


@router.post("/scenario")
def set_simulation_scenario(req: ScenarioRequest):
    """Dynamically set the active synthetic meteorological storm scenario."""
    updated_state = simulator.set_scenario(req.scenario)
    return {
        "status": "scenario_applied",
        "scenario": req.scenario,
        "rainfall_1h_mm": updated_state["rainfall_1h_mm"],
        "city_risk_level": updated_state["city_risk_level"],
        "max_water_depth_cm": updated_state["max_water_depth_cm"],
        "message": f"Applied scenario '{req.scenario}' at {updated_state['rainfall_1h_mm']} mm/h."
    }


@router.post("/tick")
def advance_simulation_tick(req: TickRequest = TickRequest()):
    """
    Advance simulation time forward by N minutes.
    Accumulates stormwater based on elevation gradient, updates net rise rates, and clamps depths.
    """
    updated_state = simulator.tick(req.minutes)
    return {
        "status": "ticked",
        "minutes_advanced": req.minutes,
        "total_minutes_elapsed": updated_state["simulated_minutes_elapsed"],
        "max_water_depth_cm": updated_state["max_water_depth_cm"],
        "city_risk_level": updated_state["city_risk_level"],
        "state": updated_state
    }


@router.post("/rainfall")
def adjust_simulation_rainfall(req: RainfallRequest):
    """Manually adjust rainfall intensity from interactive dashboard slider."""
    updated_state = simulator.set_rainfall(req.rainfall_1h_mm)
    return {
        "status": "rainfall_adjusted",
        "rainfall_1h_mm": updated_state["rainfall_1h_mm"],
        "city_risk_level": updated_state["city_risk_level"],
        "state": updated_state
    }


@router.get("/status")
def get_simulation_status():
    """Returns the comprehensive real-time hydrological status across all zones."""
    return simulator.get_status()


@router.get("/weather")
def get_current_weather():
    """Retrieve current meteorological status based on the simulation engine."""
    state = simulator.get_status()
    rainfall = state["rainfall_1h_mm"]
    
    if rainfall > 100:
        cond = "Violent Cloudburst Inundation"
    elif rainfall > 60:
        cond = "Severe Monsoon Downpour"
    elif rainfall > 25:
        cond = "Moderate Monsoon Rain"
    else:
        cond = "Controlled Baseline / Light Mist"

    return {
        "rainfall_1h_mm": rainfall,
        "soil_saturation_pct": state["soil_saturation_pct"],
        "temperature_c": 26.2,
        "relative_humidity_pct": min(98.0, 75.0 + (rainfall * 0.2)),
        "wind_speed_kmh": round(15.0 + (rainfall * 0.25), 1),
        "condition": cond,
        "active_preset": state["active_preset"]
    }
