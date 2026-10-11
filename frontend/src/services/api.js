import axios from 'axios';
import { 
  SENSOR_NODES, 
  ACTIVE_ALERTS, 
  ROUTE_DEMO, 
  INITIAL_METRICS 
} from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Response interceptor for unified logging
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn(`[FloodGuard API] Offline/Fallback trigger: ${error.message}`);
    return Promise.reject(error);
  }
);

/**
 * Health check endpoint
 */
export async function checkHealth() {
  try {
    const res = await apiClient.get('/health');
    return res.data;
  } catch (err) {
    return {
      status: 'offline_fallback',
      mode: 'simulation',
      aws_connected: false,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Simulation Controls
 */
export async function setScenario(scenarioKey) {
  try {
    const res = await apiClient.post('/api/v1/simulation/scenario', { scenario: scenarioKey });
    return res.data;
  } catch (err) {
    return { status: 'mock_applied', scenario: scenarioKey };
  }
}

export async function advanceSimulationTick(minutes = 3) {
  try {
    const res = await apiClient.post('/api/v1/simulation/tick', { minutes });
    return res.data;
  } catch (err) {
    return { status: 'mock_ticked', minutes_advanced: minutes };
  }
}

export async function adjustRainfall(rainfall_1h_mm) {
  try {
    const res = await apiClient.post('/api/v1/simulation/rainfall', { rainfall_1h_mm });
    return res.data;
  } catch (err) {
    return { status: 'mock_rainfall', rainfall_1h_mm };
  }
}

export async function getSimulationStatus() {
  try {
    const res = await apiClient.get('/api/v1/simulation/status');
    return res.data;
  } catch (err) {
    return null;
  }
}

/**
 * Fetch all active sensors
 */
export async function getSensors() {
  try {
    const res = await apiClient.get('/api/v1/sensors');
    return res.data;
  } catch (err) {
    return SENSOR_NODES;
  }
}

/**
 * Ingest sensor telemetry reading
 */
export async function postSensorReading(reading) {
  try {
    const res = await apiClient.post('/api/v1/sensors/reading', reading);
    return res.data;
  } catch (err) {
    return { success: true, reading_id: 'mock-uuid', mode: 'simulated' };
  }
}

/**
 * Fetch GeoJSON flood zones
 */
export async function getZonesGeoJSON() {
  try {
    const res = await apiClient.get('/api/v1/zones');
    return res.data;
  } catch (err) {
    return null;
  }
}

/**
 * Request ML 30m / 60m flood depth prediction
 */
export async function requestPrediction(params) {
  try {
    const res = await apiClient.post('/api/v1/predictions/predict', params);
    return res.data;
  } catch (err) {
    return {
      zone_id: params.zone_id,
      current_depth_cm: params.current_water_depth_cm,
      predicted_depth_30m_cm: params.current_water_depth_cm + 14,
      predicted_depth_60m_cm: params.current_water_depth_cm + 28,
      risk_level: 'HIGH',
      submergence_probability_pct: 75.0
    };
  }
}

/**
 * Calculate A* safe emergency route
 */
export async function calculateRoute(origin, destination, maxTolerableDepth = 50.0) {
  try {
    const res = await apiClient.post('/api/v1/route', { 
      origin, 
      destination,
      max_tolerable_depth_cm: maxTolerableDepth
    });
    return res.data;
  } catch (err) {
    return ROUTE_DEMO;
  }
}

/**
 * Fetch available road network nodes for route planning
 */
export async function getRoutingNodes() {
  try {
    const res = await apiClient.get('/api/v1/route/nodes');
    return res.data;
  } catch (err) {
    return [
      { id: "NODE_AMBULANCE_DEPOT", name: "Fire Station #7 / Ambulance Bay #4", elevation_m: 16.8 },
      { id: "NODE_METRO_HOSPITAL", name: "St. Jude Trauma Emergency Hospital", elevation_m: 19.2 },
      { id: "NODE_RESIDENTIAL_SEC4", name: "Sector 4 Lowland Gateway", elevation_m: 8.4 },
      { id: "NODE_METRO_STATION", name: "Metro Station North Plaza", elevation_m: 12.5 }
    ];
  }
}

/**
 * Fetch live active flood alerts
 */
export async function getAlerts() {
  try {
    const res = await apiClient.get('/api/v1/alerts');
    return res.data;
  } catch (err) {
    return ACTIVE_ALERTS;
  }
}

export default apiClient;
