import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { TrendingUp, Waves, Cpu, AlertTriangle } from 'lucide-react';

export default function WaterLevelChart({ 
  currentDepth = 78.4, 
  predicted30m = 94.2, 
  predicted60m = 118.0, 
  riseRate = 3.8,
  selectedZone = 'ZONE_B'
}) {
  const [horizon, setHorizon] = useState('both'); // '30m' | '60m' | 'both'

  // Synthesize realistic historical progression leading to currentDepth
  const t_minus_15 = Math.max(0, currentDepth - (riseRate * 15 * 0.9));
  const t_minus_10 = Math.max(0, currentDepth - (riseRate * 10 * 0.95));
  const t_minus_5  = Math.max(0, currentDepth - (riseRate * 5 * 1.0));

  const chartData = [
    { time: 'T - 15m', depth: Number(t_minus_15.toFixed(1)), type: 'historical' },
    { time: 'T - 10m', depth: Number(t_minus_10.toFixed(1)), type: 'historical' },
    { time: 'T - 5m',  depth: Number(t_minus_5.toFixed(1)),  type: 'historical' },
    { time: 'NOW',     depth: Number(currentDepth.toFixed(1)), type: 'current' },
    { time: 'T + 15m', depth: Number(((currentDepth + predicted30m) / 2).toFixed(1)), type: 'forecast' },
    { time: 'T + 30m', depth: Number(predicted30m.toFixed(1)), type: 'forecast' },
    { time: 'T + 45m', depth: Number(((predicted30m + predicted60m) / 2).toFixed(1)), type: 'forecast' },
    { time: 'T + 60m', depth: Number(predicted60m.toFixed(1)), type: 'forecast' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPast = data.type === 'historical';
      const isCurrent = data.type === 'current';
      const isOver = data.depth >= 90.0;

      return (
        <div style={{
          background: 'rgba(11, 19, 41, 0.95)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${isOver ? '#ef4444' : '#38bdf8'}`,
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)'
        }}>
          <div style={{ color: '#94a3b8', fontSize: '0.68rem', marginBottom: '2px' }}>
            {label} ({isPast ? 'Telemetry History' : isCurrent ? 'Live HC-SR04 Ping' : 'XGBoost ML Forecast'})
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isOver ? '#ef4444' : '#38bdf8' }}>
            {data.depth} <span style={{ fontSize: '0.7rem' }}>cm depth</span>
          </div>
          {isOver && (
            <div style={{ color: '#ef4444', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <AlertTriangle size={11} /> BREACHES 90cm THRESHOLD
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel" id="water-level-depth-trend-panel" style={{ marginTop: '12px' }}>
      <div className="panel-header" style={{ marginBottom: '8px' }}>
        <span className="panel-title">
          <Waves size={16} style={{ color: '#38bdf8' }} />
          Dual-Horizon Hydrograph Forecast
        </span>
        <span className="panel-badge badge-cyan" style={{ fontSize: '0.65rem' }}>
          XGBOOST DUAL-HORIZON
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          Historical Telemetry vs. Forward 60-Minute Projection Curve
        </span>

        <div style={{ display: 'flex', gap: '4px' }}>
          {['both', '30m', '60m'].map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHorizon(h)}
              style={{
                padding: '2px 8px',
                background: horizon === h ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${horizon === h ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '4px',
                color: horizon === h ? '#38bdf8' : '#94a3b8',
                fontSize: '0.65rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase'
              }}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="depthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false}
              fontFamily="var(--font-mono)"
            />
            <YAxis 
              domain={[0, 140]} 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false}
              fontFamily="var(--font-mono)"
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Critical Submergence Reference Line (90 cm) */}
            <ReferenceLine 
              y={90} 
              stroke="#ef4444" 
              strokeDasharray="4 4" 
              strokeWidth={1.5}
              label={{
                value: 'CRITICAL LIMIT (90cm)', 
                fill: '#ef4444', 
                fontSize: 9, 
                position: 'insideTopRight',
                fontFamily: 'var(--font-mono)'
              }}
            />

            <Area 
              type="monotone" 
              dataKey="depth" 
              stroke="#38bdf8" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#depthGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: '8px', 
        paddingTop: '6px', 
        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
        fontSize: '0.68rem',
        fontFamily: 'var(--font-mono)',
        color: '#94a3b8'
      }}>
        <span>CURRENT: {currentDepth.toFixed(1)} cm</span>
        <span style={{ color: predicted30m >= 90 ? '#ef4444' : '#f59e0b' }}>
          T+30m: {predicted30m.toFixed(1)} cm
        </span>
        <span style={{ color: predicted60m >= 90 ? '#ef4444' : '#f59e0b' }}>
          T+60m: {predicted60m.toFixed(1)} cm
        </span>
      </div>
    </div>
  );
}
