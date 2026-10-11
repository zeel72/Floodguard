import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  ShieldCheck, 
  AlertTriangle, 
  Compass, 
  Clock, 
  Milestone, 
  Truck, 
  ArrowRight,
  RotateCw,
  TrendingDown
} from 'lucide-react';
import { calculateRoute, getRoutingNodes } from '../../services/api';

const VEHICLE_PRESETS = [
  { id: 'ambulance', label: 'Ambulance', fording_cm: 50.0, icon: '🚑' },
  { id: 'rescue_truck', label: 'Fire / Rescue Truck', fording_cm: 75.0, icon: '🚒' },
  { id: 'high_axle', label: 'High-Axle 4x4', fording_cm: 100.0, icon: '🛻' }
];

export default function RoutePlannerPanel({ onRouteCalculated, currentRoute }) {
  const [nodes, setNodes] = useState([]);
  const [origin, setOrigin] = useState('NODE_AMBULANCE_DEPOT');
  const [destination, setDestination] = useState('NODE_METRO_HOSPITAL');
  const [vehicle, setVehicle] = useState(VEHICLE_PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState(currentRoute || null);

  useEffect(() => {
    async function loadNodes() {
      const data = await getRoutingNodes();
      if (data && data.length > 0) {
        setNodes(data);
      }
    }
    loadNodes();
  }, []);

  const handleCalculateRoute = async () => {
    setLoading(true);
    try {
      const res = await calculateRoute(origin, destination, vehicle.fording_cm);
      setRouteResult(res);
      if (onRouteCalculated) {
        onRouteCalculated(res);
      }
    } catch (err) {
      console.error('[RoutePlanner] Calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const standard = routeResult?.standard_shortest_route;
  const safe = routeResult?.safe_flood_avoidance_route;

  return (
    <div className="glass-panel" id="safe-route-planner-panel">
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">
          <Navigation size={16} style={{ color: '#10b981' }} />
          SafeRoute Emergency Dispatch
        </span>
        <span className="panel-badge badge-safe">
          A* ALGORITHM ACTIVE
        </span>
      </div>

      {/* Navigation Node Selectors */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        <div>
          <label style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Emergency Origin Location
          </label>
          <select 
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '6px',
              padding: '6px 8px',
              color: '#f8fafc',
              fontSize: '0.78rem',
              outline: 'none',
              marginTop: '2px'
            }}
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id} style={{ background: '#0b1329', color: '#f8fafc' }}>
                {n.name} (Elev {n.elevation_m}m)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Trauma / Destination Center
          </label>
          <select 
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '6px',
              padding: '6px 8px',
              color: '#f8fafc',
              fontSize: '0.78rem',
              outline: 'none',
              marginTop: '2px'
            }}
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id} style={{ background: '#0b1329', color: '#f8fafc' }}>
                {n.name} (Elev {n.elevation_m}m)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vehicle Type Selector */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
          Vehicle Fording Tolerance:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {VEHICLE_PRESETS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVehicle(v)}
              style={{
                background: vehicle.id === v.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${vehicle.id === v.id ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '6px',
                padding: '6px 4px',
                cursor: 'pointer',
                textAlign: 'center',
                color: vehicle.id === v.id ? '#10b981' : '#94a3b8',
                fontSize: '0.72rem',
                transition: 'all 0.2s ease'
              }}
            >
              <div>{v.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '0.68rem', marginTop: '2px' }}>{v.label}</div>
              <div style={{ fontSize: '0.62rem', opacity: 0.8 }}>&le; {v.fording_cm}cm</div>
            </button>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={handleCalculateRoute}
        disabled={loading}
        className="btn-tick"
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          padding: '8px',
          borderRadius: '6px',
          fontWeight: 700,
          fontSize: '0.8rem',
          cursor: loading ? 'wait' : 'pointer',
          marginBottom: '12px'
        }}
      >
        <RotateCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        {loading ? 'Solving A* Graph...' : 'Calculate Safe Evacuation Route'}
      </button>

      {/* Comparative Route Results Cards */}
      {routeResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* 1. SafeRoute (Recommended Green Card) */}
          <div className="route-preview-card safe">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} />
                FloodGuard SafeRoute (A*)
              </span>
              <span className="panel-badge badge-safe" style={{ fontSize: '0.62rem' }}>
                {safe?.passability}
              </span>
            </div>

            <div className="route-stat-grid">
              <div className="route-stat-box">
                <div className="route-stat-label">DISTANCE</div>
                <div className="route-stat-val" style={{ color: '#10b981' }}>{safe?.distance_km} km</div>
              </div>
              <div className="route-stat-box">
                <div className="route-stat-label">ETA</div>
                <div className="route-stat-val">{safe?.eta_min} min</div>
              </div>
              <div className="route-stat-box">
                <div className="route-stat-label">MAX DEPTH</div>
                <div className="route-stat-val" style={{ color: '#10b981' }}>{safe?.max_flood_depth_cm} cm</div>
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: '1.3' }}>
              {safe?.narrative}
            </div>
          </div>

          {/* 2. Standard Shortest Route (Danger Red Card) */}
          <div className="route-preview-card danger">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} />
                Legacy GPS Shortest Route
              </span>
              <span className="panel-badge badge-critical" style={{ fontSize: '0.62rem' }}>
                {standard?.passability}
              </span>
            </div>

            <div className="route-stat-grid">
              <div className="route-stat-box">
                <div className="route-stat-label">DISTANCE</div>
                <div className="route-stat-val">{standard?.distance_km} km</div>
              </div>
              <div className="route-stat-box">
                <div className="route-stat-label">ETA</div>
                <div className="route-stat-val">{standard?.eta_min} min</div>
              </div>
              <div className="route-stat-box">
                <div className="route-stat-label">MAX DEPTH</div>
                <div className="route-stat-val" style={{ color: '#ef4444' }}>{standard?.max_flood_depth_cm} cm</div>
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: '1.3' }}>
              {standard?.narrative}
            </div>
          </div>

          {/* Delta Savings Indicator */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '6px',
            padding: '8px',
            fontSize: '0.72rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'var(--font-mono)'
          }}>
            <span style={{ color: '#94a3b8' }}>
              Detour: +{routeResult.detour_distance_km}km (+{routeResult.detour_time_min}m)
            </span>
            <span style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingDown size={13} />
              Risk Reduced: {routeResult.risk_reduction_pct}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
