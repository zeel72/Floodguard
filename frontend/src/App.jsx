import React, { useState } from 'react';
import Header from './components/layout/Header';
import MetricCard from './components/metrics/MetricCard';
import { 
  SIMULATION_SCENARIOS, 
  INITIAL_METRICS, 
  SENSOR_NODES, 
  ACTIVE_ALERTS, 
  ROUTE_DEMO 
} from './services/mockData';
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
  Sparkles,
  Layers,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  Flame,
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [activeScenarioKey, setActiveScenarioKey] = useState('heavy_monsoon');
  const [systemMode, setSystemMode] = useState('simulation');
  const [filterLayer, setFilterLayer] = useState('all');

  const currentScenario = SIMULATION_SCENARIOS[activeScenarioKey];

  // Derive dynamic metrics based on active simulation scenario
  const metrics = {
    rainfall_1h_mm: currentScenario.rainfall_mm,
    current_depth_cm: currentScenario.maxDepth_cm,
    predicted_30m_cm: currentScenario.depth30m,
    predicted_60m_cm: currentScenario.depth60m,
    flood_probability_pct: currentScenario.prob_pct,
    risk_level: currentScenario.risk,
    rise_rate_cm_per_min: parseFloat(currentScenario.trend),
    time_to_critical_min: currentScenario.timeToCrit_min,
    active_warnings_count: currentScenario.activeAlerts
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
        riskLevel={metrics.risk_level}
      />

      <main className="main-content">
        <div className="command-grid">
          {/* ==============================================================
              LEFT COLUMN: Hydrological Telemetry & AI Forecasting
              ============================================================== */}
          <section className="command-col command-col-left" aria-label="Hydrology and Telemetry">
            {/* Real-time KPI Cards */}
            <div className="glass-panel">
              <div className="panel-header">
                <span className="panel-title">
                  <Activity size={16} style={{ color: '#38bdf8' }} />
                  Telemetry Overview
                </span>
                <span className={`panel-badge ${getThreatBadgeClass(metrics.risk_level)}`}>
                  {metrics.risk_level}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <MetricCard 
                  label="Rainfall Intensity"
                  value={metrics.rainfall_1h_mm.toFixed(1)}
                  unit="mm/h"
                  trend={currentScenario.trend}
                  trendDirection={metrics.rise_rate_cm_per_min > 0 ? 'up' : 'down'}
                  riskLevel={metrics.rainfall_1h_mm > 75 ? 'CRITICAL' : metrics.rainfall_1h_mm > 50 ? 'HIGH' : metrics.rainfall_1h_mm > 25 ? 'MODERATE' : 'SAFE'}
                  progressPct={(metrics.rainfall_1h_mm / 120) * 100}
                  icon={CloudRain}
                  subtext="Meteorological Doppler Radar"
                />

                <MetricCard 
                  label="Max Street Water Depth"
                  value={metrics.current_depth_cm.toFixed(1)}
                  unit="cm"
                  trend={`${metrics.rise_rate_cm_per_min > 0 ? '+' : ''}${metrics.rise_rate_cm_per_min.toFixed(1)} cm/min`}
                  trendDirection={metrics.rise_rate_cm_per_min > 0 ? 'up' : 'down'}
                  riskLevel={metrics.current_depth_cm >= 80 ? 'CRITICAL' : metrics.current_depth_cm >= 60 ? 'HIGH' : metrics.current_depth_cm >= 40 ? 'MODERATE' : 'SAFE'}
                  progressPct={(metrics.current_depth_cm / 100) * 100}
                  icon={Waves}
                  subtext="HC-SR04 Ultrasonic Ingestion"
                />

                <MetricCard 
                  label="XGBoost 30m Prediction"
                  value={metrics.predicted_30m_cm.toFixed(1)}
                  unit="cm"
                  trend={`60m Forecast: ${metrics.predicted_60m_cm.toFixed(1)} cm`}
                  trendDirection="up"
                  riskLevel={metrics.predicted_30m_cm >= 90 ? 'CRITICAL' : metrics.predicted_30m_cm >= 70 ? 'HIGH' : 'MODERATE'}
                  progressPct={(metrics.predicted_30m_cm / 120) * 100}
                  icon={Cpu}
                  subtext="Confidence: 94.2% (Dual-Horizon)"
                />

                <MetricCard 
                  label="Flood Submergence Risk"
                  value={`${metrics.flood_probability_pct}%`}
                  unit=""
                  trend={metrics.time_to_critical_min ? `${metrics.time_to_critical_min}m to Critical` : 'Normal Flow'}
                  trendDirection={metrics.time_to_critical_min ? 'up' : 'neutral'}
                  riskLevel={metrics.risk_level}
                  progressPct={metrics.flood_probability_pct}
                  icon={AlertOctagon}
                  subtext="Hydrological Runoff Matrix"
                />
              </div>
            </div>

            {/* Weather Simulation Scenario Selector */}
            <div className="glass-panel">
              <div className="panel-header">
                <span className="panel-title">
                  <SlidersHorizontal size={16} style={{ color: '#38bdf8' }} />
                  Weather Scenarios
                </span>
                <span className="panel-badge badge-safe">SIM TESTBENCH</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: '8px' }}>
                Simulate flash floods and monsoon spikes to test automatic failover and risk triggers.
              </p>

              <div className="scenario-pill-group">
                {Object.entries(SIMULATION_SCENARIOS).map(([key, sc]) => (
                  <button
                    key={key}
                    type="button"
                    className={`scenario-btn ${activeScenarioKey === key ? 'active' : ''}`}
                    onClick={() => setActiveScenarioKey(key)}
                  >
                    <span>{sc.label.split(' ')[0]} {sc.label.split(' ')[1]}</span>
                    <span className="rate">{sc.rainfall_mm} mm/h</span>
                  </button>
                ))}
              </div>
            </div>

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
                {SENSOR_NODES.slice(0, 4).map((sensor) => (
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
              {/* Tactical Alert Banner */}
              <div className="threat-ribbon">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                  <div>
                    <strong>CRITICAL INUNDATION ADVISORY:</strong> Zone B (Railway Underpass) forecasted to reach 90cm critical depth in {metrics.time_to_critical_min || 18} minutes.
                  </div>
                </div>
                <span className="panel-badge badge-critical" style={{ animation: 'pulse-fast 1s infinite' }}>
                  ACTION REQUIRED
                </span>
              </div>

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

              {/* High-Tech Tactical HUD / Map Container */}
              <div className="tactical-display" id="tactical-radar-viewport">
                <div className="radar-sweep" />

                {/* Tactical Radar Center Reticle & Nodes */}
                <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '24px' }}>
                  <div style={{ 
                    display: 'inline-flex', 
                    padding: '8px 16px', 
                    background: 'rgba(7, 13, 24, 0.85)', 
                    border: '1px solid rgba(56, 189, 248, 0.4)', 
                    borderRadius: '24px',
                    marginBottom: '14px',
                    boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)'
                  }}>
                    <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="pulse-dot" />
                      SECTOR GRID: MUMBAI METROPOLITAN BASIN [19.0760° N, 72.8777° E]
                    </span>
                  </div>

                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
                    Hydrological Risk Layers & Route Waypoints
                  </h2>
                  <p style={{ color: '#94a3b8', maxWidth: '520px', margin: '0 auto 18px', fontSize: '0.82rem' }}>
                    Real-time spatial visualization overlaying ultrasonic sensor streams, elevation contours, and dynamic flood inundation polygons.
                  </p>

                  {/* Interactive Node Coordinates Grid */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                    gap: '10px', 
                    maxWidth: '650px', 
                    margin: '0 auto' 
                  }}>
                    {SENSOR_NODES.map((sensor) => (
                      <div 
                        key={sensor.id}
                        style={{
                          background: 'rgba(15, 23, 42, 0.85)',
                          border: `1px solid ${sensor.risk === 'CRITICAL' ? 'rgba(239, 68, 68, 0.4)' : sensor.risk === 'HIGH' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.2)'}`,
                          borderRadius: '8px',
                          padding: '10px',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>{sensor.id}</span>
                          <span className={`panel-badge ${getThreatBadgeClass(sensor.risk)}`} style={{ fontSize: '0.65rem' }}>
                            {sensor.risk}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f8fafc' }}>{sensor.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                          Depth: {sensor.depth_cm}cm ({sensor.rise_rate})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom HUD Telemetry Strip */}
                <div style={{ 
                  position: 'absolute', 
                  bottom: '12px', 
                  left: '16px', 
                  right: '16px', 
                  background: 'rgba(7, 13, 24, 0.85)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <span style={{ color: '#94a3b8' }}>
                    COORDINATE SYSTEM: WGS84 • REFRESH: 3.0s • SENSORS: 6/6 SYNCED
                  </span>
                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={13} />
                    LEAFLET ENGINE MOUNT READY
                  </span>
                </div>
              </div>

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
                      {metrics.current_depth_cm.toFixed(1)} <span style={{ fontSize: '0.75rem' }}>cm</span>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>T + 30 MIN PREDICTION</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: metrics.predicted_30m_cm >= 90 ? '#ef4444' : '#f59e0b' }}>
                      {metrics.predicted_30m_cm.toFixed(1)} <span style={{ fontSize: '0.75rem' }}>cm</span>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>T + 60 MIN PREDICTION</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: '#ef4444' }}>
                      {metrics.predicted_60m_cm.toFixed(1)} <span style={{ fontSize: '0.75rem' }}>cm</span>
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
            {/* SafeRoute Emergency Routing Module */}
            <div className="glass-panel">
              <div className="panel-header">
                <span className="panel-title">
                  <Navigation size={16} style={{ color: '#10b981' }} />
                  SafeRoute Navigator
                </span>
                <span className="panel-badge badge-safe">A* DIJKSTRA</span>
              </div>

              <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginBottom: '10px' }}>
                Hydrology-weighted graph routing actively bypassing road segments exceeding 50cm water depth.
              </div>

              {/* Waypoint Selectors */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <MapPin size={14} style={{ color: '#38bdf8' }} />
                  <span style={{ fontSize: '0.75rem', color: '#f8fafc', fontWeight: 600 }}>{ROUTE_DEMO.origin}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '0.75rem', color: '#f8fafc', fontWeight: 600 }}>{ROUTE_DEMO.destination}</span>
                </div>
              </div>

              {/* Safe Route (Recommended) */}
              <div className="route-preview-card safe">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} /> RECOMMENDED SAFE ROUTE
                  </span>
                  <span className="panel-badge badge-safe">100% PASSABLE</span>
                </div>
                <div className="route-stat-grid">
                  <div className="route-stat-box">
                    <div className="route-stat-label">Distance</div>
                    <div className="route-stat-val">{ROUTE_DEMO.safeRoute.distance_km} km</div>
                  </div>
                  <div className="route-stat-box">
                    <div className="route-stat-label">ETA</div>
                    <div className="route-stat-val">{ROUTE_DEMO.safeRoute.eta_min} min</div>
                  </div>
                  <div className="route-stat-box">
                    <div className="route-stat-label">Max Depth</div>
                    <div className="route-stat-val" style={{ color: '#10b981' }}>{ROUTE_DEMO.safeRoute.maxFloodDepth_cm} cm</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  {ROUTE_DEMO.safeRoute.recommendation}
                </p>
              </div>

              {/* Standard Shortest Route (Warning) */}
              <div className="route-preview-card danger">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={16} /> STANDARD SHORTEST ROUTE
                  </span>
                  <span className="panel-badge badge-critical">BLOCKED</span>
                </div>
                <div className="route-stat-grid">
                  <div className="route-stat-box">
                    <div className="route-stat-label">Distance</div>
                    <div className="route-stat-val">{ROUTE_DEMO.standardRoute.distance_km} km</div>
                  </div>
                  <div className="route-stat-box">
                    <div className="route-stat-label">ETA</div>
                    <div className="route-stat-val">{ROUTE_DEMO.standardRoute.eta_min} min</div>
                  </div>
                  <div className="route-stat-box">
                    <div className="route-stat-label">Max Depth</div>
                    <div className="route-stat-val" style={{ color: '#ef4444' }}>{ROUTE_DEMO.standardRoute.maxFloodDepth_cm} cm</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.72rem', color: '#ef4444', lineHeight: 1.4 }}>
                  {ROUTE_DEMO.standardRoute.warning}
                </p>
              </div>
            </div>

            {/* Live Alerts Drawer */}
            <div className="glass-panel">
              <div className="panel-header">
                <span className="panel-title">
                  <AlertOctagon size={16} style={{ color: '#f59e0b' }} />
                  Live Threshold Alerts
                </span>
                <span className="panel-badge badge-critical">
                  {ACTIVE_ALERTS.length} ACTIVE
                </span>
              </div>

              <div>
                {ACTIVE_ALERTS.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`alert-item ${alert.severity === 'CRITICAL' ? 'alert-critical' : alert.severity === 'HIGH' ? 'alert-high' : 'alert-moderate'}`}
                  >
                    <div className="alert-top">
                      <span className="alert-title">{alert.title}</span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{alert.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 600 }}>{alert.zone}</div>
                    <p className="alert-desc">{alert.message}</p>
                    <div className="alert-action">
                      <ArrowRight size={12} />
                      {alert.action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
