import React, { useState, useEffect } from 'react';
import { 
  CloudRain, 
  FastForward, 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Sparkles,
  AlertTriangle,
  Flame,
  Droplets
} from 'lucide-react';

export const PRESETS = [
  { id: 'dry', label: 'Dry Baseline', rain: 2, icon: '☀️', risk: 'LOW' },
  { id: 'moderate_rain', label: 'Monsoon Rain', rain: 35, icon: '🌧️', risk: 'MODERATE' },
  { id: 'flash_flood', label: 'Flash Flood', rain: 95, icon: '⛈️', risk: 'HIGH' },
  { id: 'cloudburst', label: 'Cloudburst Crisis', rain: 140, icon: '🚨', risk: 'CRITICAL' }
];

export default function SimulationControls({
  activePreset = 'flash_flood',
  rainfall = 95,
  soilSaturation = 88,
  elapsedMinutes = 0,
  onSelectPreset,
  onRainfallChange,
  onTick,
  onReset
}) {
  const [autoTick, setAutoTick] = useState(false);
  const [isTicking, setIsTicking] = useState(false);

  // Auto-tick effect (advances time every 3.5s when activated)
  useEffect(() => {
    let timer = null;
    if (autoTick) {
      timer = setInterval(() => {
        handleTriggerTick();
      }, 3500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [autoTick]);

  const handleTriggerTick = async () => {
    setIsTicking(true);
    if (onTick) await onTick(3);
    setTimeout(() => setIsTicking(false), 400);
  };

  const getRainfallColor = (val) => {
    if (val >= 100) return '#ef4444';
    if (val >= 70) return '#f59e0b';
    if (val >= 30) return '#eab308';
    return '#38bdf8';
  };

  return (
    <div className="glass-panel" id="simulation-controls-panel">
      <div className="panel-header">
        <span className="panel-title">
          <Sliders size={16} style={{ color: '#38bdf8' }} />
          Weather Simulation Console
        </span>
        <span className="panel-badge badge-safe">
          T+{elapsedMinutes}M ELAPSED
        </span>
      </div>

      <p style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: '12px', lineHeight: 1.4 }}>
        Autonomously simulate storm spikes, flash inundations, and runoff dynamics with zero-hardware dependency.
      </p>

      {/* Preset Selector Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {PRESETS.map((p) => {
          const isActive = activePreset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className={`scenario-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPreset && onSelectPreset(p.id)}
              style={{
                borderColor: isActive ? getRainfallColor(p.rain) : undefined,
                boxShadow: isActive ? `0 0 12px ${getRainfallColor(p.rain)}40` : undefined
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>{p.icon} {p.label}</span>
                <span className={`panel-badge badge-${p.risk.toLowerCase()}`} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                  {p.risk}
                </span>
              </div>
              <span className="rate">{p.rain} mm/h precipitation</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Rainfall Slider */}
      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CloudRain size={14} style={{ color: getRainfallColor(rainfall) }} />
            Manual Rainfall Influx:
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: getRainfallColor(rainfall) }}>
            {rainfall.toFixed(1)} <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>mm/h</span>
          </span>
        </div>

        <input 
          type="range"
          min="0"
          max="160"
          step="1"
          value={rainfall}
          onChange={(e) => onRainfallChange && onRainfallChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            accentColor: getRainfallColor(rainfall),
            cursor: 'pointer'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.68rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
          <span>0 mm/h (Dry)</span>
          <span>50 mm/h</span>
          <span>100 mm/h</span>
          <span>160 mm/h (Crisis)</span>
        </div>
      </div>

      {/* Hydraulic Influx Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '14px' }}>
        <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Droplets size={12} style={{ color: '#38bdf8' }} /> Soil Saturation
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#f8fafc', marginTop: '2px' }}>
            {soilSaturation.toFixed(0)}%
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
            Catchment Retention
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: soilSaturation > 80 ? '#ef4444' : '#10b981', marginTop: '2px' }}>
            {soilSaturation > 80 ? 'RUNOFF 94%' : 'ABSORBING'}
          </div>
        </div>
      </div>

      {/* Execution Actions: Step Forward & Auto-Cycle */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {/* Step Forward (Tick) Button */}
        <button
          type="button"
          onClick={handleTriggerTick}
          disabled={isTicking}
          style={{
            flex: 1,
            background: isTicking ? 'rgba(56, 189, 248, 0.3)' : 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '6px',
            color: '#38bdf8',
            padding: '9px 12px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            transform: isTicking ? 'scale(0.98)' : 'scale(1)'
          }}
          title="Advance simulation by 3 minutes"
        >
          <FastForward size={14} style={{ animation: isTicking ? 'pulse-fast 0.4s infinite' : 'none' }} />
          <span>Advance +3m Tick</span>
        </button>

        {/* Auto Run Toggle */}
        <button
          type="button"
          onClick={() => setAutoTick(!autoTick)}
          style={{
            background: autoTick ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${autoTick ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '6px',
            color: autoTick ? '#10b981' : '#94a3b8',
            padding: '9px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Auto-run continuous storm simulation"
        >
          {autoTick ? <Pause size={14} /> : <Play size={14} />}
          <span>{autoTick ? 'Auto Live' : 'Auto'}</span>
        </button>

        {/* Reset */}
        <button
          type="button"
          onClick={onReset}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            color: '#94a3b8',
            padding: '9px 10px',
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Reset simulation to dry baseline"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
