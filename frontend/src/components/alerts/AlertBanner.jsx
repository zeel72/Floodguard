import React, { useState } from 'react';
import { AlertTriangle, AlertOctagon, ShieldAlert, ArrowRight, X, ChevronRight } from 'lucide-react';

export default function AlertBanner({ alerts = [], onSelectAlert }) {
  const [dismissed, setDismissed] = useState(false);

  // Find most critical active alert
  const topAlert = alerts.find((a) => a.severity === 'CRITICAL') || 
                   alerts.find((a) => a.severity === 'HIGH') || 
                   alerts[0];

  if (!topAlert || topAlert.severity === 'SAFE' || dismissed) {
    return null;
  }

  const isCritical = topAlert.severity === 'CRITICAL';
  const badgeClass = isCritical ? 'badge-critical' : 'badge-high';
  const borderGlow = isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)';

  return (
    <div 
      className="threat-ribbon" 
      id="critical-alert-banner"
      style={{
        border: `1px solid ${borderGlow}`,
        boxShadow: isCritical ? '0 0 24px rgba(239, 68, 68, 0.25)' : '0 0 20px rgba(245, 158, 11, 0.2)',
        animation: isCritical ? 'pulse-border 2s infinite' : 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        {isCritical ? (
          <AlertOctagon size={20} style={{ color: '#ef4444', animation: 'spin-slow 6s linear infinite' }} />
        ) : (
          <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
        )}

        <div style={{ fontSize: '0.82rem', lineHeight: '1.3' }}>
          <strong>
            {isCritical ? 'CRITICAL INUNDATION ADVISORY:' : 'SEVERE HYDROLOGICAL WARNING:'}
          </strong>{' '}
          <span>
            {topAlert.title} in <strong>{topAlert.zone_name}</strong>. {topAlert.action}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {topAlert.time_to_critical_min && (
          <span 
            className="panel-badge" 
            style={{ 
              background: 'rgba(239, 68, 68, 0.25)', 
              color: '#fca5a5', 
              border: '1px solid #ef4444',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem'
            }}
          >
            T - {topAlert.time_to_critical_min.toFixed(0)} MINS
          </span>
        )}

        <span className={`panel-badge ${badgeClass}`} style={{ animation: isCritical ? 'pulse-fast 1s infinite' : 'none' }}>
          {topAlert.severity} ALERT
        </span>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '2px 4px',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Dismiss advisory ribbon"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
