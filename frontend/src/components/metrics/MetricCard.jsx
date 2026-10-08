import React from 'react';
import { 
  CloudRain, 
  Waves, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle,
  Clock,
  Gauge
} from 'lucide-react';

export default function MetricCard({
  label,
  value,
  unit,
  trend,
  trendDirection = 'up', // 'up' | 'down' | 'neutral'
  riskLevel = 'SAFE', // 'CRITICAL' | 'HIGH' | 'MODERATE' | 'SAFE'
  progressPct = 50,
  icon: Icon = Gauge,
  subtext
}) {
  const getBorderClass = () => {
    switch (riskLevel) {
      case 'CRITICAL': return 'border-critical';
      case 'HIGH': return 'border-high';
      case 'MODERATE': return 'border-moderate';
      default: return 'border-safe';
    }
  };

  const getPillClass = () => {
    switch (riskLevel) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MODERATE': return 'badge-moderate';
      default: return 'badge-safe';
    }
  };

  const getBarFillColor = () => {
    switch (riskLevel) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f59e0b';
      case 'MODERATE': return '#eab308';
      default: return '#10b981';
    }
  };

  const renderTrendIcon = () => {
    if (trendDirection === 'up') return <TrendingUp size={14} style={{ color: riskLevel === 'CRITICAL' ? '#ef4444' : '#f59e0b' }} />;
    if (trendDirection === 'down') return <TrendingDown size={14} style={{ color: '#10b981' }} />;
    return <Minus size={14} style={{ color: '#94a3b8' }} />;
  };

  return (
    <div className={`metric-card ${getBorderClass()}`} id={`metric-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
      <div className="metric-card-top">
        <span className="metric-label">
          {Icon && <Icon size={14} style={{ color: '#38bdf8' }} />}
          {label}
        </span>
        <span className={`metric-pill ${getPillClass()}`}>
          {riskLevel}
        </span>
      </div>

      <div className="metric-value-wrap">
        <span className="metric-value">{value}</span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>

      {/* Progress / Threshold Bar */}
      <div className="metric-bar-bg" title={`${progressPct}% of danger threshold`}>
        <div 
          className="metric-bar-fill"
          style={{ 
            width: `${Math.min(Math.max(progressPct, 0), 100)}%`,
            backgroundColor: getBarFillColor()
          }}
        />
      </div>

      <div className="metric-footer">
        {trend && (
          <span className="metric-trend">
            {renderTrendIcon()}
            <span style={{ color: '#cbd5e1' }}>{trend}</span>
          </span>
        )}
        {subtext && (
          <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}
