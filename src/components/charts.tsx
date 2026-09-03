import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';

/* ------------------------------------------------------------- useMeasure */
function useMeasure(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(560);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(es => setW(es[0].contentRect.width));
    ro.observe(ref.current);
    setW(ref.current.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

const fmtY = (v: number) => (v >= 100 ? `₹${(v / 100).toFixed(1)}Cr` : `₹${Math.round(v * 10) / 10}L`);

/* ------------------------------------------------------------- AreaChart */
export function AreaChart({ data, labels = [], height = 190, tone = '212 162 83', currency = true, showLine2, line2Tone = '111 130 242' }: {
  data: number[]; labels?: string[]; height?: number; tone?: string; currency?: boolean; showLine2?: number[]; line2Tone?: string;
}) {
  const [ref, w] = useMeasure();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 38, r: 10, t: 12, b: 22 };
  const iw = Math.max(10, w - pad.l - pad.r);
  const ih = height - pad.t - pad.b;
  const all = showLine2 ? [...data, ...showLine2] : data;
  const max = Math.max(...all, 1) * 1.12;
  const min = Math.min(...all, 0) * 0.9;
  const x = (i: number) => pad.l + (iw * i) / Math.max(1, data.length - 1);
  const y = (v: number) => pad.t + ih - ((v - min) / (max - min || 1)) * ih;

  const pts = data.map((v, i) => [x(i), y(v)] as const);
  const path = pts.map(([px, py], i) => (i === 0 ? `M${px},${py}` : `L${px},${py}`)).join(' ');
  const area = `${path} L${x(data.length - 1)},${pad.t + ih} L${x(0)},${pad.t + ih} Z`;
  const pts2 = showLine2?.map((v, i) => [x(i), y(v)] as const);
  const path2 = pts2?.map(([px, py], i) => (i === 0 ? `M${px},${py}` : `L${px},${py}`)).join(' ');

  const onMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * w;
    const idx = Math.round(((px - pad.l) / iw) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, idx)));
  };

  return (
    <div ref={ref} className="relative w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id={`ag-${tone.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`rgb(${tone})`} stopOpacity=".34" />
            <stop offset="100%" stopColor={`rgb(${tone})`} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <g key={f}>
            <line x1={pad.l} x2={w - pad.r} y1={pad.t + ih * f} y2={pad.t + ih * f} stroke="rgba(255,255,255,.05)" strokeDasharray="2 6" />
            <text x={pad.l - 6} y={pad.t + ih * f + 3} textAnchor="end" fontSize="9.5" fill="rgba(255,255,255,.32)" fontFamily="JetBrains Mono, monospace">
              {currency ? fmtY(min + (max - min) * (1 - f)) : Math.round(min + (max - min) * (1 - f))}
            </text>
          </g>
        ))}
        <motion.path d={area} fill={`url(#ag-${tone.replace(/\s/g, '')})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.5 }} />
        <motion.path d={path} fill="none" stroke={`rgb(${tone})`} strokeWidth="2.4" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }} />
        {path2 && (
          <motion.path d={path2} fill="none" stroke={`rgb(${line2Tone})`} strokeWidth="2" strokeDasharray="1 5" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }} />
        )}
        {labels.map((l, i) => (i % Math.ceil(labels.length / 6) === 0 || i === labels.length - 1) && (
          <text key={l + i} x={x(i)} y={height - 5} textAnchor="middle" fontSize="9.5" fill="rgba(255,255,255,.35)">{l}</text>
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="rgba(255,255,255,.22)" />
            <circle cx={x(hover)} cy={y(data[hover])} r="4.5" fill={`rgb(${tone})`} stroke="#0b0f1a" strokeWidth="2" />
            {showLine2 && <circle cx={x(hover)} cy={y(showLine2[hover])} r="4" fill={`rgb(${line2Tone})`} stroke="#0b0f1a" strokeWidth="2" />}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-lg border border-white/12 bg-ink-900/95 px-3 py-2 text-center shadow-xl backdrop-blur-md"
          style={{ left: `${(x(hover) / w) * 100}%`, top: 0 }}
        >
          <div className="text-[10px] uppercase tracking-wider text-white/40">{labels[hover] ?? `P${hover + 1}`}</div>
          <div className="font-mono text-[13px] font-semibold" style={{ color: `rgb(${tone})` }}>{currency ? fmtY(data[hover]) : data[hover]}</div>
          {showLine2 && <div className="font-mono text-[12px]" style={{ color: `rgb(${line2Tone})` }}>{currency ? fmtY(showLine2[hover]) : showLine2[hover]}</div>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ GroupedBars */
export function GroupedBars({ inflow, outflow, labels, height = 180 }: { inflow: number[]; outflow: number[]; labels: string[]; height?: number }) {
  const [ref, w] = useMeasure();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 38, r: 8, t: 14, b: 22 };
  const iw = Math.max(10, w - pad.l - pad.r);
  const ih = height - pad.t - pad.b;
  const max = Math.max(...inflow, ...outflow, 1) * 1.1;
  const n = inflow.length;
  const slot = iw / n;
  const bw = Math.min(13, slot * 0.31);
  return (
    <div ref={ref} className="relative w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} onMouseLeave={() => setHover(null)}>
        {[0.33, 0.66, 1].map(f => (
          <g key={f}>
            <line x1={pad.l} x2={w - pad.r} y1={pad.t + ih * f} y2={pad.t + ih * f} stroke="rgba(255,255,255,.05)" strokeDasharray="2 6" />
            <text x={pad.l - 6} y={pad.t + ih * f + 3} textAnchor="end" fontSize="9.5" fill="rgba(255,255,255,.32)" fontFamily="JetBrains Mono, monospace">{fmtY(max * (1 - f))}</text>
          </g>
        ))}
        {inflow.map((v, i) => {
          const cx = pad.l + slot * i + slot / 2;
          const h1 = (v / max) * ih; const h2 = ((outflow[i] ?? 0) / max) * ih;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} opacity={hover === null || hover === i ? 1 : 0.4} style={{ transition: 'opacity .2s' }}>
              <motion.rect x={cx - bw - 1.5} width={bw} rx="3" fill="url(#barIn)"
                initial={{ height: 0, y: pad.t + ih }} animate={{ height: h1, y: pad.t + ih - h1 }}
                transition={{ duration: 0.9, delay: i * 0.045, ease: [0.22, 0.8, 0.3, 1] }} />
              <motion.rect x={cx + 1.5} width={bw} rx="3" fill="rgba(139,159,255,.55)"
                initial={{ height: 0, y: pad.t + ih }} animate={{ height: h2, y: pad.t + ih - h2 }}
                transition={{ duration: 0.9, delay: 0.12 + i * 0.045, ease: [0.22, 0.8, 0.3, 1] }} />
              {(i % Math.ceil(n / 6) === 0 || i === n - 1) && (
                <text x={cx} y={height - 5} textAnchor="middle" fontSize="9.5" fill="rgba(255,255,255,.35)">{labels[i]}</text>
              )}
            </g>
          );
        })}
        <defs>
          <linearGradient id="barIn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eed49a" /><stop offset="100%" stopColor="#b3813c" />
          </linearGradient>
        </defs>
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-lg border border-white/12 bg-ink-900/95 px-3 py-2 shadow-xl backdrop-blur-md" style={{ left: `${((pad.l + slot * hover + slot / 2) / w) * 100}%`, top: 0 }}>
          <div className="text-[10px] uppercase tracking-wider text-white/40">{labels[hover]}</div>
          <div className="font-mono text-[12.5px] font-semibold text-gold-300">In {fmtY(inflow[hover])}</div>
          <div className="font-mono text-[12.5px] text-iris-300">Out {fmtY(outflow[hover])}</div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- Donut */
export function Donut({ segs, size = 150, center, centerSub }: { segs: { label: string; value: number; color: string }[]; size?: number; center?: ReactNode; centerSub?: string }) {
  const total = segs.reduce((a, s) => a + s.value, 0) || 1;
  const strokeW = 16; const r = (size - strokeW) / 2; const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.06)" strokeWidth={strokeW} fill="none" />
          {segs.map((s, i) => {
            const frac = s.value / total;
            const el = (
              <motion.circle key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={s.color} strokeWidth={strokeW} strokeLinecap="butt"
                strokeDasharray={`${Math.max(0, frac * c - 2.5)} ${c}`}
                initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: -acc * c }}
                transition={{ duration: 1, delay: i * 0.12, ease: [0.22, 0.8, 0.3, 1] }} />
            );
            acc += frac;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[19px] font-bold text-white">{center}</span>
          {centerSub && <span className="text-[10px] uppercase tracking-wider text-white/40">{centerSub}</span>}
        </div>
      </div>
      <ul className="space-y-2">
        {segs.map(s => (
          <li key={s.label} className="flex items-center gap-2.5 text-[12.5px]">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-white/60">{s.label}</span>
            <span className="ml-auto font-mono text-white/85">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------- Sparkline */
export function Spark({ data, tone = '238 212 154', w = 96, h = 30 }: { data: number[]; tone?: string; w?: number; h?: number }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 3 - ((v - min) / (max - min || 1)) * (h - 6)}`).join(' ');
  return (
    <svg width={w} height={h} aria-hidden className="overflow-visible">
      <motion.polyline points={pts} fill="none" stroke={`rgb(${tone})`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4 }} />
      <circle cx={w} cy={h - 3 - ((data[data.length - 1] - min) / (max - min || 1)) * (h - 6)} r="2.6" fill={`rgb(${tone})`} />
    </svg>
  );
}

/* ---------------------------------------------------- breakdown bars (AI) */
export function AxisBars({ rows }: { rows: { label: string; value: number; note: string }[] }) {
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={r.label}>
          <div className="mb-1 flex items-center justify-between text-[11.5px]">
            <span className="text-white/55">{r.label}</span>
            <span className="font-mono text-[11px] text-white/80">{Math.round(r.value * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[.06]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: r.value >= 0.85 ? 'linear-gradient(90deg,#0e9f6e,#34d399)' : r.value >= 0.55 ? 'linear-gradient(90deg,#b3813c,#eed49a)' : 'linear-gradient(90deg,#8b4b5c,#fb7185)' }}
              initial={{ width: 0 }} animate={{ width: `${r.value * 100}%` }}
              transition={{ duration: 0.9, delay: 0.15 + i * 0.1, ease: [0.22, 0.8, 0.3, 1] }}
            />
          </div>
          <p className="mt-1 text-[10.5px] text-white/35">{r.note}</p>
        </div>
      ))}
    </div>
  );
}
