import React from 'react';
import { Cpu, ShieldCheck, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

export default function FeatureImportanceChart({ 
  factors = null,
  confidencePct = 94.2
}) {
  const defaultFactors = [
    {
      feature: "water_rise_rate",
      label: "Water Rise Velocity (cm/min)",
      impact_pct: 72.0,
      direction: "risk_driver",
      color: "#ef4444"
    },
    {
      feature: "current_water_level",
      label: "Current Road Inundation (cm)",
      impact_pct: 18.0,
      direction: "risk_driver",
      color: "#f59e0b"
    },
    {
      feature: "elevation_m",
      label: "Road Elevation Gradient (m)",
      impact_pct: 7.0,
      direction: "mitigating",
      color: "#10b981"
    },
    {
      feature: "rainfall_1h",
      label: "Precipitation Rate (mm/h)",
      impact_pct: 3.0,
      direction: "risk_driver",
      color: "#38bdf8"
    }
  ];

  const displayFactors = factors && factors.length > 0 ? factors : defaultFactors;

  return (
    <div className="glass-panel" id="explainable-ai-feature-importance-panel" style={{ marginTop: '12px' }}>
      <div className="panel-header" style={{ marginBottom: '8px' }}>
        <span className="panel-title">
          <Cpu size={16} style={{ color: '#38bdf8' }} />
          XGBoost SHAP Explainability Matrix
        </span>
        <span className="panel-badge badge-safe">
          CONFIDENCE {confidencePct}%
        </span>
      </div>

      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '10px' }}>
        Dual-Horizon Feature Impact Decomposition ($R^2 = 0.999$, $\text{MAE} = 1.16\text{ cm}$):
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {displayFactors.map((f, i) => {
          const isRisk = f.direction === 'risk_driver';
          const isMitigating = f.direction === 'mitigating';
          const barColor = isMitigating ? '#10b981' : isRisk && f.impact_pct > 30 ? '#ef4444' : '#38bdf8';

          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', fontSize: '0.72rem' }}>
                <span style={{ fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {isMitigating ? (
                    <ArrowDownRight size={13} style={{ color: '#10b981' }} />
                  ) : (
                    <ArrowUpRight size={13} style={{ color: '#ef4444' }} />
                  )}
                  {f.label || f.feature}
                </span>

                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: barColor }}>
                  {f.impact_pct}% {isMitigating ? 'BUFFER' : 'DRIVE'}
                </span>
              </div>

              {/* Progress Bar Container */}
              <div style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div 
                  style={{
                    width: `${Math.min(f.impact_pct, 100)}%`,
                    height: '100%',
                    background: barColor,
                    borderRadius: '3px',
                    transition: 'width 0.6s ease'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ 
        marginTop: '10px', 
        paddingTop: '6px', 
        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
        fontSize: '0.65rem',
        color: '#64748b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>Objective: reg:squarederror</span>
        <span>Tree Estimators: 120 (Depth: 6)</span>
      </div>
    </div>
  );
}
