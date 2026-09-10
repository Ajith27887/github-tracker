'use client';

import React from 'react';

/* ---- Sparkline ---- */
interface SparklineProps {
  data: number[];
  color?: string;
  w?: number;
  h?: number;
  fill?: boolean;
}
export function Sparkline({ data, color = 'var(--accent)', w = 88, h = 28, fill = true }: SparklineProps) {
  if (!data || !data.length) return null;
  const max = Math.max(...data, 1), min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 3 - ((v - min) / range) * (h - 6);
    return [x, y] as [number, number];
  });
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L ${w} ${h} L 0 ${h} Z`;
  const gid = 'spk' + Math.random().toString(36).slice(2, 7);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.6} fill={color} />
    </svg>
  );
}

/* ---- Bar Chart ---- */
interface BarChartProps {
  data: number[];
  labels: string[];
  color?: string;
  h?: number;
}
export function BarChart({ data, labels, color = 'var(--accent)', h = 132 }: BarChartProps) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: h, width: '100%' }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>{v}</div>
          <div
            title={`${v} commits`}
            style={{
              width: '100%', maxWidth: 38,
              height: `${Math.max(4, (v / max) * (h - 34))}px`,
              background: `linear-gradient(180deg, ${color}, color-mix(in srgb, ${color} 55%, transparent))`,
              borderRadius: '6px 6px 3px 3px',
              boxShadow: `0 0 14px -4px ${color}`,
              animation: `barGrow .6s cubic-bezier(.2,.8,.2,1) ${i * 0.05}s both`,
              transformOrigin: 'bottom',
            }}
          />
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--faintest)' }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

/* ---- Donut ---- */
interface DonutSegment { value: number; color: string; }
interface DonutProps { segments: DonutSegment[]; size?: number; stroke?: number; }
export function Donut({ segments, size = 116, stroke = 13 }: DonutProps) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * C;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={s.color} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-offset}
              style={{ transition: 'stroke-dasharray .7s ease, stroke-dashoffset .7s ease' }} />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{total}</div>
          <div style={{ fontSize: 10.5, color: 'var(--faint)', letterSpacing: '.06em', textTransform: 'uppercase' }}>total</div>
        </div>
      </div>
    </div>
  );
}

/* ---- Delta ---- */
interface DeltaProps { value: number; invert?: boolean; }
export function Delta({ value, invert = false }: DeltaProps) {
  if (value === 0 || value == null) return <span className="mono" style={{ fontSize: 12, color: 'var(--faint)' }}>—</span>;
  const up = value > 0;
  const good = invert ? !up : up;
  const color = good ? 'var(--accent-bright)' : '#f0883e';
  return (
    <span className="mono" style={{ fontSize: 12, fontWeight: 600, color, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <span style={{ fontSize: 9 }}>{up ? '▲' : '▼'}</span>{Math.abs(value)}%
    </span>
  );
}

/* ---- Stat Card ---- */
interface StatCardProps {
  label: string;
  value: number | string;
  delta?: number;
  color: string;
  spark?: number[];
  invert?: boolean;
  icon: React.ReactNode;
}
export function StatCard({ label, value, delta, color, spark, invert, icon }: StatCardProps) {
  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 12.5, fontWeight: 600, letterSpacing: '.02em' }}>
          <span style={{ color, display: 'inline-flex' }}>{icon}</span>{label}
        </span>
        {delta !== undefined && <Delta value={delta} invert={invert} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
        <div className="mono" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, fontFamily: 'var(--font-display)', letterSpacing: '-.01em' }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {spark && <Sparkline data={spark} color={color} />}
      </div>
    </div>
  );
}
