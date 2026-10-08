/**
 * FloodGuard Mock Data Service
 * Provides realistic hydrological telemetry, ML prediction outputs,
 * road risk categories, and emergency dispatch routing.
 */

export const SIMULATION_SCENARIOS = {
  flash_flood: {
    id: "flash_flood",
    label: "Flash Flood Surge (Severe)",
    rainfall_mm: 98.5,
    maxDepth_cm: 88.4,
    depth30m: 108.2,
    depth60m: 135.0,
    risk: "CRITICAL",
    prob_pct: 94,
    trend: "+6.8 cm/min",
    timeToCrit_min: 12,
    activeAlerts: 5,
    summary: "Cloudburst event exceeding local storm drain throughput capacity by 280%."
  },
  heavy_monsoon: {
    id: "heavy_monsoon",
    label: "Monsoon Inundation (High)",
    rainfall_mm: 68.2,
    maxDepth_cm: 64.0,
    depth30m: 78.5,
    depth60m: 91.2,
    risk: "HIGH",
    prob_pct: 76,
    trend: "+3.4 cm/min",
    timeToCrit_min: 28,
    activeAlerts: 3,
    summary: "Steady monsoon downpour with high soil saturation and slow river discharge."
  },
  moderate_rain: {
    id: "moderate_rain",
    label: "Moderate Rainfall (Caution)",
    rainfall_mm: 34.0,
    maxDepth_cm: 38.5,
    depth30m: 44.0,
    depth60m: 49.0,
    risk: "MODERATE",
    prob_pct: 42,
    trend: "+0.9 cm/min",
    timeToCrit_min: 75,
    activeAlerts: 1,
    summary: "Sustained rainfall with localized gutter pooling in low-lying underpasses."
  },
  normal: {
    id: "normal",
    label: "Controlled / Clear Weather",
    rainfall_mm: 4.2,
    maxDepth_cm: 12.0,
    depth30m: 13.5,
    depth60m: 14.0,
    risk: "LOW",
    prob_pct: 8,
    trend: "-0.2 cm/min",
    timeToCrit_min: null,
    activeAlerts: 0,
    summary: "Dry street conditions. Storm drains operating at 12% nominal baseline."
  }
};

export const INITIAL_METRICS = {
  rainfall_1h_mm: 74.5,
  current_depth_cm: 68.2,
  predicted_30m_cm: 82.4,
  predicted_60m_cm: 104.1,
  flood_probability_pct: 78,
  risk_level: "HIGH", // LOW, MODERATE, HIGH, CRITICAL
  rise_rate_cm_per_min: 3.2,
  time_to_critical_min: 24,
  active_sensors_count: 8,
  total_sensors_count: 8,
  monitored_zones: 6,
  active_warnings_count: 4,
  aws_connected: true,
  system_mode: "simulation" // 'simulation' | 'real'
};

export const SENSOR_NODES = [
  {
    id: "SN-101",
    name: "Central Railway Underpass",
    zone: "Zone B (Underpass)",
    depth_cm: 78.4,
    rise_rate: "+4.1 cm/min",
    elevation_m: 6.2,
    battery_pct: 94,
    status: "ONLINE",
    risk: "CRITICAL",
    lat: 19.0760,
    lng: 72.8777
  },
  {
    id: "SN-102",
    name: "Mahim Creek Culvert",
    zone: "Zone C (Riverfront)",
    depth_cm: 64.2,
    rise_rate: "+2.8 cm/min",
    elevation_m: 7.1,
    battery_pct: 89,
    status: "ONLINE",
    risk: "HIGH",
    lat: 19.0820,
    lng: 72.8690
  },
  {
    id: "SN-103",
    name: "Metro Station North Plaza",
    zone: "Zone D (Commercial)",
    depth_cm: 46.0,
    rise_rate: "+1.2 cm/min",
    elevation_m: 12.5,
    battery_pct: 98,
    status: "ONLINE",
    risk: "MODERATE",
    lat: 19.0910,
    lng: 72.8850
  },
  {
    id: "SN-104",
    name: "General Hospital Arterial Ave",
    zone: "Zone E (Medical Corridor)",
    depth_cm: 22.5,
    rise_rate: "+0.4 cm/min",
    elevation_m: 16.8,
    battery_pct: 92,
    status: "ONLINE",
    risk: "LOW",
    lat: 19.0680,
    lng: 72.8910
  },
  {
    id: "SN-105",
    name: "Lowland Housing Sector 4",
    zone: "Zone F (Residential)",
    depth_cm: 58.1,
    rise_rate: "+2.1 cm/min",
    elevation_m: 8.4,
    battery_pct: 84,
    status: "ONLINE",
    risk: "HIGH",
    lat: 19.0600,
    lng: 72.8720
  },
  {
    id: "SN-106",
    name: "Eastern Express Flyover Base",
    zone: "Zone A (Highground Transit)",
    depth_cm: 14.2,
    rise_rate: "-0.1 cm/min",
    elevation_m: 19.2,
    battery_pct: 97,
    status: "ONLINE",
    risk: "LOW",
    lat: 19.0880,
    lng: 72.9020
  }
];

export const ACTIVE_ALERTS = [
  {
    id: "ALT-904",
    timestamp: "2 mins ago",
    severity: "CRITICAL",
    zone: "Zone B (Central Underpass)",
    title: "Projected Road Submergence in 18 Mins",
    message: "Ultrasonic telemetry indicates water rise rate at +4.1 cm/min. Depth reaching 90cm critical limit at 12:22 UTC.",
    action: "Emergency traffic diversion recommended immediately."
  },
  {
    id: "ALT-903",
    timestamp: "8 mins ago",
    severity: "HIGH",
    zone: "Zone C (Mahim Creek)",
    title: "Storm Drain Chokepoint Detected",
    message: "Culvert discharge speed down by 40% due to debris accumulation. Water level +2.8 cm/min.",
    action: "Dispatched automated municipal pump activation notice."
  },
  {
    id: "ALT-902",
    timestamp: "19 mins ago",
    severity: "MODERATE",
    zone: "Zone F (Lowland Housing)",
    title: "30-Min Flood Probability Exceeds 65%",
    message: "XGBoost hydrological model forecasting 78cm saturation within 45 minutes.",
    action: "First responders alerted for non-critical route bypass."
  }
];

export const WATER_TREND_SERIES = [
  { time: "-45m", depth: 18, rainfall: 22, predicted: null },
  { time: "-30m", depth: 32, rainfall: 45, predicted: null },
  { time: "-15m", depth: 49, rainfall: 68, predicted: null },
  { time: "Now", depth: 68, rainfall: 74, predicted: 68 },
  { time: "+15m", depth: null, rainfall: 82, predicted: 76 },
  { time: "+30m", depth: null, rainfall: 89, predicted: 84 },
  { time: "+45m", depth: null, rainfall: 78, predicted: 96 },
  { time: "+60m", depth: null, rainfall: 65, predicted: 104 }
];

export const ROUTE_DEMO = {
  origin: "Fire Station #7 / Ambulance Unit 104",
  destination: "St. Jude Trauma Emergency Hospital",
  standardRoute: {
    distance_km: 4.8,
    eta_min: 11,
    maxFloodDepth_cm: 82.4,
    passability: "BLOCKED",
    dangerLevel: "CRITICAL",
    warning: "Passes through submerged Central Underpass (Zone B, 82cm depth). Risk of vehicle stalling: 96%."
  },
  safeRoute: {
    distance_km: 5.6,
    eta_min: 13,
    maxFloodDepth_cm: 21.0,
    passability: "CLEAR & SAFE",
    dangerLevel: "LOW",
    detour_km: "+0.8 km",
    detour_time_min: "+2 mins",
    savings_risk: "-74% flood exposure",
    recommendation: "Via Eastern Ridge Flyover (Elev. 19.2m). Completely bypasses lowlands with 100% vehicle safety guarantee."
  }
};
