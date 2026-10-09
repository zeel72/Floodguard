from fastapi import APIRouter
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/alerts", tags=["Emergency Flood Alerts"])


class FloodAlert(BaseModel):
    id: str
    timestamp: str
    severity: str
    zone_id: str
    zone_name: str
    title: str
    message: str
    action: str


@router.get("", response_model=List[FloodAlert])
def get_active_alerts():
    """Retrieve all current active high and critical flood warnings."""
    return [
        FloodAlert(
            id="ALT-904",
            timestamp="2 mins ago",
            severity="CRITICAL",
            zone_id="ZONE_B",
            zone_name="Zone B (Central Underpass)",
            title="Projected Road Submergence in 18 Mins",
            message="Ultrasonic telemetry indicates water rise rate at +4.1 cm/min. Depth reaching 90cm critical limit.",
            action="Emergency traffic diversion recommended immediately."
        ),
        FloodAlert(
            id="ALT-903",
            timestamp="8 mins ago",
            severity="HIGH",
            zone_id="ZONE_C",
            zone_name="Zone C (Mahim Creek)",
            title="Storm Drain Chokepoint Detected",
            message="Culvert discharge speed down by 40% due to debris accumulation. Water level +2.8 cm/min.",
            action="Dispatched automated municipal pump activation notice."
        ),
        FloodAlert(
            id="ALT-902",
            timestamp="19 mins ago",
            severity="MODERATE",
            zone_id="ZONE_F",
            zone_name="Zone F (Lowland Housing)",
            title="30-Min Flood Probability Exceeds 65%",
            message="XGBoost hydrological model forecasting 78cm saturation within 45 minutes.",
            action="First responders alerted for non-critical route bypass."
        )
    ]
