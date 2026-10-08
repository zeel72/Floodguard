import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  CloudLightning, 
  Radio, 
  Clock, 
  Database,
  Cpu,
  Layers
} from 'lucide-react';

export default function Header({ 
  mode = 'simulation', 
  onToggleMode,
  awsConnected = true,
  riskLevel = 'HIGH'
}) {
  const [timeStr, setTimeStr] = useState('');
  const [utcStr, setUtcStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
      setUtcStr(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getThreatBadgeClass = () => {
    switch (riskLevel) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MODERATE': return 'badge-moderate';
      default: return 'badge-safe';
    }
  };

  return (
    <header className="header-container" id="command-center-header">
      <div className="header-inner">
        {/* Brand & Identity */}
        <div className="brand-section">
          <div className="brand-logo-glow" title="FloodGuard Operational Hub">
            <ShieldAlert size={24} className="text-cyan-400" />
          </div>
          <div className="brand-text">
            <h1>
              FLOODGUARD
              <span className={`panel-badge ${getThreatBadgeClass()}`} style={{ fontSize: '0.65rem', verticalAlign: 'middle' }}>
                {riskLevel} RISK
              </span>
            </h1>
            <p>Urban Hydrological Intelligence, AI Forecasting & Safe Evacuation Routing</p>
          </div>
        </div>

        {/* Live Operational Status Group */}
        <div className="header-status-group">
          {/* Live Telemetry / Simulation Toggle */}
          <button 
            type="button"
            className="status-chip"
            onClick={onToggleMode}
            style={{ 
              cursor: 'pointer', 
              background: mode === 'simulation' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              borderColor: mode === 'simulation' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(16, 185, 129, 0.4)'
            }}
            title="Click to toggle between Hardware IoT and Autonomous Simulation"
          >
            <span className={`pulse-dot ${mode === 'real' ? 'pulse-safe' : 'pulse-cyan'}`} />
            <Radio size={14} style={{ color: mode === 'simulation' ? '#38bdf8' : '#10b981' }} />
            <span>
              MODE: <strong>{mode === 'simulation' ? 'SIMULATION' : 'LIVE SENSORS'}</strong>
            </span>
          </button>

          {/* AWS Cloud Connection */}
          <div className="status-chip" title="AWS Cloud Infrastructure State">
            <Database size={14} style={{ color: awsConnected ? '#10b981' : '#f59e0b' }} />
            <span>AWS: <strong>{awsConnected ? 'DYNAMODB LIVE' : 'LOCAL CACHE'}</strong></span>
          </div>

          {/* XGBoost Predictor Engine */}
          <div className="status-chip" title="Dual Horizon ML Predictor">
            <Cpu size={14} style={{ color: '#38bdf8' }} />
            <span>AI: <strong>XGBOOST 60m</strong></span>
          </div>

          {/* Dynamic UTC & Local Clock */}
          <div className="status-chip" style={{ minWidth: '155px' }}>
            <Clock size={14} style={{ color: '#94a3b8' }} />
            <span>{timeStr} <span style={{ color: '#64748b', fontSize: '0.72rem' }}>({utcStr})</span></span>
          </div>
        </div>
      </div>
    </header>
  );
}
