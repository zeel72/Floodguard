import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import MetricCard from './components/metrics/MetricCard';
import SimulationControls, { PRESETS } from './components/layout/SimulationControls';
import WaterLevelChart from './components/metrics/WaterLevelChart';
import FeatureImportanceChart from './components/explainability/FeatureImportanceChart';
import FloodMap from './components/map/FloodMap';
import RoutePlannerPanel from './components/routing/RoutePlannerPanel';
import AlertBanner from './components/alerts/AlertBanner';
import AlertsDrawer from './components/alerts/AlertsDrawer';
import { 
  SENSOR_NODES, 
  ACTIVE_ALERTS, 
  ROUTE_DEMO 
} from './services/mockData';
import {
  setScenario as apiSetScenario,
  advanceSimulationTick as apiAdvanceTick,
  adjustRainfall as apiAdjustRainfall,
  getSimulationStatus as apiGetStatus,
  getZonesGeoJSON as apiGetZonesGeoJSON,
  getAlerts as apiGetAlerts
} from './services/api';
import { 
  CloudRain, 
  Waves, 
  AlertOctagon, 
  Compass, 
  Navigation, 
  Activity, 
  MapPin, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [activePreset, setActivePreset] = useState('flash_flood');
  const [systemMode, setSystemMode] = useState('simulation');
  const [filterLayer, setFilterLayer] = useState('all');

  // Dynamic simulation telemetry state
  const [rainfall, setRainfall] = useState(95.0);
  const [currentDepth, setCurrentDepth] = useState(78.4);
  const [predicted30m, setPredicted30m] = useState(94.2);
  const [predicted60m, setPredicted60m] = useState(118.0);
  const [riskLevel, setRiskLevel] = useState('CRITICAL');
  const [riseRate, setRiseRate] = useState(3.8);
  const [soilSaturation, setSoilSaturation] = useState(88.0);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [sensors, setSensors] = useState(SENSOR_NODES);
  const [zonesGeoJSON, setZonesGeoJSON] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [alerts, setAlerts] = useState(ACTIVE_ALERTS);

  const fetchZonesAndAlerts = async () => {
    try {
      const [geo, alts] = await Promise.all([
        apiGetZonesGeoJSON(),
        apiGetAlerts()
      ]);
      if (geo && geo.features) setZonesGeoJSON(geo);
      if (alts && alts.length > 0) setAlerts(alts);
    } catch (err) {
      // Mock fallback
    }
  };

  // Poll or sync simulation state on mount + continuous 3.5s interval
  useEffect(() => {
    async function initSim() {
      try {
        const [state, geo, alts] = await Promise.all([
          apiGetStatus(),
          apiGetZonesGeoJSON(),
          apiGetAlerts()
        ]);
        if (state && state.rainfall_1h_mm !== undefined) {
          applySimulationState(state);
        }
        if (geo && geo.features) {
          setZonesGeoJSON(geo);
        }
        if (alts && alts.length > 0) {
          setAlerts(alts);
        }
      } catch (err) {
        // Mock fallback active
      }
    }
    initSim();

    const interval = setInterval(async () => {
      try {
        const [state, alts] = await Promise.all([
          apiGetStatus(),
          apiGetAlerts()
        ]);
        if (state && state.rainfall_1h_mm !== undefined) {
          applySimulationState(state);
        }
        if (alts && alts.length > 0) {
          setAlerts(alts);
        }
      } catch (err) {
        // quiet fallback
      }
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const applySimulationState = (state) => {
    setRainfall(state.rainfall_1h_mm);
    setCurrentDepth(state.max_water_depth_cm);
    setPredicted30m(state.predicted_depth_30m_cm);
    setPredicted60m(state.predicted_depth_60m_cm);
    setRiskLevel(state.city_risk_level);
    setSoilSaturation(state.soil_saturation_pct);
    setElapsedMinutes(state.simulated_minutes_elapsed);
    if (state.active_preset) setActivePreset(state.active_preset);

    if (state.zones && state.zones.length > 0) {
      const maxRise = Math.max(...state.zones.map(z => z.rise_rate_cm_per_min || 0));
      if (Number.isFinite(maxRise)) {
        setRiseRate(Number(maxRise.toFixed(2)));
      }
      setSensors((prev) => 
        prev.map((s) => {
          const match = state.zones.find((z) => z.sensor_id === s.id);
          if (match) {
            return {
              ...s,
              depth_cm: match.water_depth_cm,
              rise_rate: `${match.rise_rate_cm_per_min > 0 ? '+' : ''}${match.rise_rate_cm_per_min} cm/min`,
              risk: match.risk_level
            };
          }
          return s;
        })
      );
    }
  };

  const handleSelectPreset = async (presetId) => {
    setActivePreset(presetId);
    try {
      await apiSetScenario(presetId);
      const [state, geo, alts] = await Promise.all([
        apiGetStatus(),
        apiGetZonesGeoJSON(),
        apiGetAlerts()
      ]);
      if (state) applySimulationState(state);
      if (geo) setZonesGeoJSON(geo);
      if (alts) setAlerts(alts);
    } catch (err) {
      // Local fallback calculation
      const p = PRESETS.find((x) => x.id === presetId);
      if (p) {
        setRainfall(p.rain);
        setRiskLevel(p.risk);
        setCurrentDepth(p.rain * 0.7);
        setPredicted30m(p.rain * 0.9);
        setPredicted60m(p.rain * 1.15);
      }
    }
  };

  const handleRainfallChange = async (newVal) => {
    setRainfall(newVal);
    try {
      await apiAdjustRainfall(newVal);
      const [state, geo, alts] = await Promise.all([
        apiGetStatus(),
        apiGetZonesGeoJSON(),
        apiGetAlerts()
      ]);
      if (state) applySimulationState(state);
      if (geo) setZonesGeoJSON(geo);
      if (alts) setAlerts(alts);
    } catch (err) {
      setCurrentDepth(newVal * 0.7);
    }
  };

  const handleTick = async (mins = 3) => {
    setElapsedMinutes((prev) => prev + mins);
    try {
      const res = await apiAdvanceTick(mins);
      if (res && res.state) {
        applySimulationState(res.state);
      }
      fetchZonesAndAlerts();
    } catch (err) {
      setCurrentDepth((prev) => Math.min(prev + (riseRate * mins), 200));
    }
  };

  const handleReset = async () => {
    await handleSelectPreset('dry');
    setElapsedMinutes(0);
    fetchZonesAndAlerts();
  };

  const handleToggleMode = () => {
    setSystemMode((prev) => (prev === 'simulation' ? 'real' : 'simulation'));
  };

  const getThreatBadgeClass = (risk) => {
    switch (risk) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MODERATE': return 'badge-moderate';
      default: return 'badge-safe';
    }
  };

  return (
    <div className="app-container">
      {/* 1. Global Header Bar */}
      <Header 
        mode={systemMode}
        onToggleMode={handleToggleMode}
        awsConnected={true}
        riskLevel={riskLevel}
      />

      <main className="main-content">
        <div className="command-grid">
          {/* ==============================================================
              LEFT COLUMN: Hydrological Telemetry & Simulation Controls
              ============================================================== */}
          <section className="command-col command-col-left" aria-label="Hydrology and Telemetry">
            {/* Real-time KPI Cards */}
            <div className="glass-panel">
              <div className="panel-header">
                <span className="panel-title">
                  <Activity size={16} style={{ color: '#38bdf8' }} />
                  Telemetry Overview
                </span>
                <span className={`panel-badge ${getThreatBadgeClass(riskLevel)}`}>
                  {riskLevel}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <MetricCard 
                  label="Rainfall Intensity"
                  value={rainfall.toFixed(1)}
                  unit="mm/h"
                  trend={`${rainfall > 50 ? 'Severe Influx' : 'Normal Flow'}`}
                  trendDirection={rainfall > 40 ? 'up' : 'down'}
                  riskLevel={rainfall > 85 ? 'CRITICAL' : rainfall > 55 ? 'HIGH' : rainfall > 25 ? 'MODERATE' : 'SAFE'}
                  progressPct={(rainfall / 140) * 100}
                  icon={CloudRain}
                  subtext="Meteorological Doppler Radar"
                />

                <MetricCard 
                  label="Max Street Water Depth"
                  value={currentDepth.toFixed(1)}
                  unit="cm"
                  trend={`${riseRate > 0 ? '+' : ''}${riseRate.toFixed(1)} cm/min`}
                  trendDirection={riseRate > 0 ? 'up' : 'down'}
                  riskLevel={currentDepth >= 85 ? 'CRITICAL' : currentDepth >= 60 ? 'HIGH' : currentDepth >= 40 ? 'MODERATE' : 'SAFE'}
                  progressPct={(currentDepth / 110) * 100}
                  icon={Waves}
                  subtext="Ultrasonic HC-SR04 Stream"
                />

                <MetricCard 
                  label="XGBoost 30m Prediction"
                  value={predicted30m.toFixed(1)}
                  unit="cm"
                  trend={`60m Forecast: ${predicted60m.toFixed(1)} cm`}
                  trendDirection="up"
                  riskLevel={predicted30m >= 90 ? 'CRITICAL' : predicted30m >= 70 ? 'HIGH' : 'MODERATE'}
                  progressPct={(predicted30m / 130) * 100}
                  icon={Cpu}
                  subtext="Confidence: 94.2% (Dual-Horizon)"
                />

                <MetricCard 
                  label="Flood Submergence Risk"
                  value={`${Math.min(Math.round((currentDepth / 90) * 100), 100)}%`}
                  unit=""
                  trend={currentDepth >= 90 ? 'BREACHED (>90cm)' : `${Math.max(Math.round((90 - currentDepth) / Math.max(riseRate, 0.5)), 1)}m to Critical`}
                  trendDirection={riseRate > 0 ? 'up' : 'neutral'}
                  riskLevel={riskLevel}
                  progressPct={Math.min((currentDepth / 90) * 100, 100)}
                  icon={AlertOctagon}
                  subtext="Hydrological Runoff Matrix"
                />
              </div>
            </div>

            {/* Weather Simulation Control Console */}
            <SimulationControls 
              activePreset={activePreset}
              rainfall={rainfall}
              soilSaturation={soilSaturation}
              elapsedMinutes={elapsedMinutes}
              onSelectPreset={handleSelectPreset}
              onRainfallChange={handleRainfallChange}
              onTick={handleTick}
              onReset={handleReset}
            />

            {/* Phase 13: Dual-Horizon Telemetry & ML Forecast Area Chart */}
            <WaterLevelChart 
              currentDepth={currentDepth}
              predicted30m={predicted30m}
              predicted60m={predicted60m}
              riseRate={riseRate}
            />

            {/* Phase 13: XGBoost Explainable AI SHAP Decomposition */}
            <FeatureImportanceChart />

            {/* Sensor Telemetry List */}
            <div className="glass-panel">
              <div className="panel-header">
                <span className="panel-title">
                  <Activity size={16} style={{ color: '#38bdf8' }} />
                  Active Ultrasonic Nodes
                </span>
                <span className="panel-badge badge-safe">6 ONLINE</span>
              </div>
              <div>
                {sensors.slice(0, 4).map((sensor) => (
                  <div key={sensor.id} className="sensor-row">
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{sensor.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{sensor.zone} • Elev {sensor.elevation_m}m</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: sensor.risk === 'CRITICAL' ? '#ef4444' : sensor.risk === 'HIGH' ? '#f59e0b' : '#38bdf8' }}>
                        {sensor.depth_cm} cm
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        Bat {sensor.battery_pct}% • {sensor.rise_rate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ==============================================================
              CENTER COLUMN: Tactical Situational Map & Predictive Radar
              ============================================================== */}
          <section className="command-col command-col-center" aria-label="Command Center Map Console">
            <div className="glass-panel map-viewport-panel">
              {/* Phase 12: Dynamic Critical Emergency Advisory Banner */}
              <AlertBanner alerts={alerts} />

              {/* Console Map Header Controls */}
              <div className="map-viewport-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="panel-title">
                    <Compass size={18} style={{ color: '#38bdf8' }} />
                    Situational GIS Operations Console
                  </span>
                  <span className="panel-badge badge-safe">LEAFLET READY</span>
                </div>
                
                {/* Layer Toggle Pills */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['all', 'sensors', 'flood-zones', 'routes'].map((lyr) => (
                    <button
                      key={lyr}
                      type="button"
                      onClick={() => setFilterLayer(lyr)}
                      style={{
                        padding: '4px 10px',
                        background: filterLayer === lyr ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${filterLayer === lyr ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: '6px',
                        color: filterLayer === lyr ? '#38bdf8' : '#94a3b8',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {lyr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phase 8: Interactive React-Leaflet GIS Flood Map */}
              <FloodMap 
                zonesGeoJSON={zonesGeoJSON}
                sensors={sensors}
                activeFilter={filterLayer}
                activeRoute={activeRoute}
              />

              {/* Water Level Horizon Barometer */}
              <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem' }}>
                  <span style={{ fontWeight: 600, color: '#f8fafc' }}>Hydrological Water Level Forecast Horizons:</span>
                  <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>Critical Limit: 90.0 cm</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>CURRENT DEPTH</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                      {currentDepth.toFixed(1)} <span style={{ fontSize: '0.75rem' }}>cm</span>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>T + 30 MIN PREDICTION</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: predicted30m >= 90 ? '#ef4444' : '#f59e0b' }}>
                      {predicted30m.toFixed(1)} <span style={{ fontSize: '0.75rem' }}>cm</span>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>T + 60 MIN PREDICTION</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: '#ef4444' }}>
                      {predicted60m.toFixed(1)} <span style={{ fontSize: '0.75rem' }}>cm</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==============================================================
              RIGHT COLUMN: Safe Emergency Routing & Actionable Alerts
              ============================================================== */}
          <section className="command-col command-col-right" aria-label="Routing and Alerts">
            {/* Phase 11: Interactive SafeRoute A* Emergency Planner */}
            <RoutePlannerPanel 
              onRouteCalculated={(route) => setActiveRoute(route)}
              currentRoute={activeRoute}
            />

            {/* Phase 12: Live Early Warning & Threshold Alerts Drawer */}
            <AlertsDrawer 
              alerts={alerts} 
              onRefresh={fetchZonesAndAlerts} 
            />
          </section>
        </div>
      </main>
    </div>
  );
}
