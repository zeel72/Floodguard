import React from 'react';
import { Polygon, Popup } from 'react-leaflet';
import { AlertTriangle, Clock, Waves, TrendingUp, Cpu, ShieldCheck } from 'lucide-react';

export default function ZonePolygonLayer({ zonesGeoJSON }) {
  if (!zonesGeoJSON || !zonesGeoJSON.features) return null;

  const getColor = (risk) => {
    switch (risk?.toUpperCase()) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f59e0b';
      case 'MODERATE': return '#eab308';
      default: return '#10b981';
    }
  };

  return (
    <>
      {zonesGeoJSON.features.map((feature) => {
        const props = feature.properties || {};
        const coords = feature.geometry?.coordinates?.[0] || [];
        
        // GeoJSON uses [lng, lat], Leaflet uses [lat, lng]
        const leafletCoords = coords.map(([lng, lat]) => [lat, lng]);
        if (leafletCoords.length < 3) return null;

        const color = props.color_hex || getColor(props.risk_level);
        const isCritical = props.risk_level === 'CRITICAL';

        return (
          <Polygon
            key={feature.id || props.zone_id}
            positions={leafletCoords}
            pathOptions={{
              color: color,
              weight: isCritical ? 2.5 : 1.8,
              opacity: 0.9,
              fillColor: color,
              fillOpacity: isCritical ? 0.45 : 0.28,
              dashArray: isCritical ? '4, 4' : undefined
            }}
          >
            <Popup className="floodguard-popup">
              <div style={{ minWidth: '220px', padding: '4px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f8fafc' }}>
                    {props.name}
                  </span>
                  <span 
                    className={`panel-badge badge-${(props.risk_level || 'low').toLowerCase()}`}
                    style={{ fontSize: '0.65rem' }}
                  >
                    {props.risk_level}
                  </span>
                </div>

                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
                  ID: {props.zone_id} • Elev: {props.elevation_m}m
                </div>

                {/* Depth Comparison Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '6px', marginBottom: '8px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>NOW</div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f8fafc' }}>
                      {props.current_depth_cm?.toFixed(1)}<span style={{ fontSize: '0.65rem' }}>cm</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#38bdf8' }}>+30m</div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: color }}>
                      {props.predicted_depth_30m_cm?.toFixed(1)}<span style={{ fontSize: '0.65rem' }}>cm</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#f59e0b' }}>+60m</div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: props.predicted_depth_60m_cm >= 90 ? '#ef4444' : color }}>
                      {props.predicted_depth_60m_cm?.toFixed(1)}<span style={{ fontSize: '0.65rem' }}>cm</span>
                    </div>
                  </div>
                </div>

                {/* Dynamics & Velocity */}
                <div style={{ fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Rise Velocity:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: props.water_rise_rate_cm_per_min > 0 ? '#ef4444' : '#10b981' }}>
                    {props.water_rise_rate_cm_per_min > 0 ? '+' : ''}{props.water_rise_rate_cm_per_min?.toFixed(2)} cm/min
                  </span>
                </div>

                <div style={{ fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Time to Critical:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: props.time_to_critical_min ? '#ef4444' : '#10b981' }}>
                    {props.time_to_critical_min ? `${props.time_to_critical_min} mins` : 'Normal Flow'}
                  </span>
                </div>

                <div style={{ fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Flood Probability:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: color }}>
                    {Math.round((props.flood_probability || 0.1) * 100)}%
                  </span>
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
}
