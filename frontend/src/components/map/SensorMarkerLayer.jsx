import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Radio, BatteryCharging, Waves, TrendingUp, Cpu } from 'lucide-react';

function createSensorDivIcon(sensor) {
  const isCritical = sensor.risk === 'CRITICAL' || sensor.current_depth_cm >= 90;
  const isHigh = sensor.risk === 'HIGH' || sensor.current_depth_cm >= 70;
  const isModerate = sensor.risk === 'MODERATE' || sensor.current_depth_cm >= 50;
  
  const color = isCritical ? '#ef4444' : isHigh ? '#f59e0b' : isModerate ? '#eab308' : '#10b981';
  const glow = isCritical ? 'rgba(239, 68, 68, 0.6)' : isHigh ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.4)';

  const html = `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -50%);
      cursor: pointer;
    ">
      <!-- Pulsing Outer Ring -->
      <div style="
        position: absolute;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${glow};
        animation: pulse-marker 2s infinite ease-out;
        opacity: 0.6;
      "></div>

      <!-- Core Sensor Badge -->
      <div style="
        position: relative;
        z-index: 2;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #0b1329;
        border: 2px solid ${color};
        box-shadow: 0 0 10px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${color};
        "></div>
      </div>

      <!-- Floating Water Depth Label -->
      <div style="
        margin-top: 3px;
        background: rgba(11, 19, 41, 0.9);
        border: 1px solid ${color};
        border-radius: 4px;
        padding: 1px 5px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: 700;
        color: #ffffff;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.6);
      ">
        ${(sensor.current_depth_cm ?? sensor.depth_cm ?? 0).toFixed(0)}cm
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-sensor-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 21]
  });
}

export default function SensorMarkerLayer({ sensors }) {
  if (!sensors || sensors.length === 0) return null;

  return (
    <>
      {sensors.map((sensor) => {
        const lat = sensor.latitude ?? sensor.lat;
        const lng = sensor.longitude ?? sensor.lng;
        if (!lat || !lng) return null;

        const depth = sensor.current_depth_cm ?? sensor.depth_cm ?? 0;
        const rise = sensor.water_rise_rate_cm_per_min ?? sensor.rise_rate ?? '+0.0';

        return (
          <Marker
            key={sensor.sensor_id || sensor.id}
            position={[lat, lng]}
            icon={createSensorDivIcon(sensor)}
          >
            <Popup className="floodguard-popup">
              <div style={{ minWidth: '200px', padding: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#f8fafc' }}>
                    {sensor.name}
                  </span>
                  <span className="panel-badge badge-safe" style={{ fontSize: '0.62rem' }}>
                    {sensor.status || 'ONLINE'}
                  </span>
                </div>

                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
                  Node: {sensor.sensor_id || sensor.id} • Elev: {sensor.elevation_m}m
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem' }}>
                    <span style={{ color: '#94a3b8' }}>Live Depth:</span>
                    <span style={{ fontWeight: 800, color: depth >= 70 ? '#ef4444' : '#38bdf8' }}>
                      {depth.toFixed(1)} cm
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: '#94a3b8' }}>Rise Velocity:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f8fafc' }}>
                      {rise}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span>Battery Health:</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{sensor.battery_pct}%</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
