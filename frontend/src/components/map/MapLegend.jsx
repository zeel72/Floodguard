import React from 'react';
import { Layers, ShieldAlert, Radio, Hospital, Flame, Eye, EyeOff } from 'lucide-react';

export default function MapLegend({
  layers = { zones: true, sensors: true, route: true, pois: true },
  onToggleLayer
}) {
  return (
    <div className="map-legend-hud" id="map-legend-controls">
      <div className="legend-header">
        <span className="legend-title">
          <Layers size={13} style={{ color: '#38bdf8' }} />
          GIS Risk Layers & POIs
        </span>
      </div>

      {/* Flood Threat Color Scale */}
      <div className="legend-section">
        <div className="legend-label">Water Depth Inundation:</div>
        <div className="legend-scale">
          <div className="scale-item">
            <span className="scale-swatch" style={{ background: '#ef4444' }} />
            <span>&gt;90cm Critical</span>
          </div>
          <div className="scale-item">
            <span className="scale-swatch" style={{ background: '#f59e0b' }} />
            <span>70-90cm High</span>
          </div>
          <div className="scale-item">
            <span className="scale-swatch" style={{ background: '#eab308' }} />
            <span>50-70cm Mod</span>
          </div>
          <div className="scale-item">
            <span className="scale-swatch" style={{ background: '#10b981' }} />
            <span>&lt;50cm Safe</span>
          </div>
        </div>
      </div>

      {/* Layer Visibility Toggles */}
      <div className="legend-section" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
        <div className="legend-label">Active Overlays:</div>
        <div className="legend-toggles">
          <button 
            type="button"
            className={`legend-toggle-btn ${layers.zones ? 'active' : ''}`}
            onClick={() => onToggleLayer && onToggleLayer('zones')}
          >
            <ShieldAlert size={11} style={{ color: layers.zones ? '#38bdf8' : '#64748b' }} />
            <span>Zones</span>
          </button>

          <button 
            type="button"
            className={`legend-toggle-btn ${layers.sensors ? 'active' : ''}`}
            onClick={() => onToggleLayer && onToggleLayer('sensors')}
          >
            <Radio size={11} style={{ color: layers.sensors ? '#10b981' : '#64748b' }} />
            <span>Sensors</span>
          </button>

          <button 
            type="button"
            className={`legend-toggle-btn ${layers.route ? 'active' : ''}`}
            onClick={() => onToggleLayer && onToggleLayer('route')}
          >
            <span style={{ width: 8, height: 2, background: layers.route ? '#10b981' : '#64748b', display: 'inline-block' }} />
            <span>A* Route</span>
          </button>

          <button 
            type="button"
            className={`legend-toggle-btn ${layers.pois ? 'active' : ''}`}
            onClick={() => onToggleLayer && onToggleLayer('pois')}
          >
            <Hospital size={11} style={{ color: layers.pois ? '#ec4899' : '#64748b' }} />
            <span>POIs</span>
          </button>
        </div>
      </div>
    </div>
  );
}
