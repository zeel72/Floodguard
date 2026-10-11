import React, { useState } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  ArrowRight, 
  CheckCircle2, 
  RotateCw, 
  ShieldAlert,
  Clock
} from 'lucide-react';

export default function AlertsDrawer({ alerts = [], onRefresh, loading = false }) {
  const [filter, setFilter] = useState('ALL');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'ALL') return true;
    if (filter === 'CRITICAL') return a.severity === 'CRITICAL';
    if (filter === 'HIGH') return a.severity === 'HIGH';
    if (filter === 'MODERATE') return a.severity === 'MODERATE';
    return true;
  });

  const critCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH').length;
  const modCount = alerts.filter((a) => a.severity === 'MODERATE').length;

  const getAlertSeverityClass = (sev) => {
    switch (sev) {
      case 'CRITICAL': return 'alert-critical';
      case 'HIGH': return 'alert-high';
      case 'MODERATE': return 'alert-moderate';
      default: return 'alert-safe';
    }
  };

  const getSeverityIcon = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return <AlertOctagon size={16} style={{ color: '#ef4444' }} />;
      case 'HIGH':
        return <AlertTriangle size={16} style={{ color: '#f59e0b' }} />;
      case 'MODERATE':
        return <Info size={16} style={{ color: '#38bdf8' }} />;
      default:
        return <CheckCircle2 size={16} style={{ color: '#10b981' }} />;
    }
  };

  return (
    <div className="glass-panel" id="live-alerts-drawer">
      {/* Drawer Header */}
      <div className="panel-header">
        <span className="panel-title">
          <AlertOctagon size={16} style={{ color: critCount > 0 ? '#ef4444' : '#38bdf8' }} />
          Early Warning & Threshold Alerts
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`panel-badge ${critCount > 0 ? 'badge-critical' : 'badge-safe'}`}>
            {critCount > 0 ? `${critCount} CRITICAL` : `${alerts.length} ACTIVE`}
          </span>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: loading ? 'wait' : 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Refresh live flood warnings"
            >
              <RotateCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        {[
          { key: 'ALL', label: `ALL (${alerts.length})` },
          { key: 'CRITICAL', label: `CRIT (${critCount})` },
          { key: 'HIGH', label: `HIGH (${highCount})` },
          { key: 'MODERATE', label: `MOD (${modCount})` }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            style={{
              flex: 1,
              padding: '4px 6px',
              background: filter === tab.key ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${filter === tab.key ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: '4px',
              color: filter === tab.key ? '#38bdf8' : '#94a3b8',
              fontSize: '0.68rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              textAlign: 'center'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alert Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
        {filteredAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '0.75rem' }}>
            No warnings matching current filter.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`alert-item ${getAlertSeverityClass(alert.severity)}`}
              style={{ padding: '10px', borderRadius: '8px' }}
            >
              {/* Alert Title & Severity */}
              <div className="alert-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <span className="alert-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.8rem' }}>
                  {getSeverityIcon(alert.severity)}
                  {alert.title}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                  {alert.timestamp}
                </span>
              </div>

              {/* Affected Zone & Breach Countdown */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 600 }}>
                  {alert.zone_name}
                </span>

                {alert.time_to_critical_min && (
                  <span style={{ 
                    fontSize: '0.65rem', 
                    color: '#ef4444', 
                    fontFamily: 'var(--font-mono)', 
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Clock size={11} />
                    {alert.time_to_critical_min.toFixed(0)}m to breach
                  </span>
                )}
              </div>

              {/* Message Narrative */}
              <p className="alert-desc" style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.3, marginBottom: '6px' }}>
                {alert.message}
              </p>

              {/* Action Directive */}
              <div className="alert-action" style={{ 
                fontSize: '0.7rem', 
                color: alert.severity === 'CRITICAL' ? '#fca5a5' : '#38bdf8', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px',
                lineHeight: 1.2
              }}>
                <ArrowRight size={12} style={{ flexShrink: 0 }} />
                <span>{alert.action}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
