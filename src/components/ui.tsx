import { useEffect, useRef, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { initials } from '../lib/format';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

/* ------------------------------------------------------------------- logo */
export function Logo({ size = 30, word = true, dark = false }: { size?: number; word?: boolean; dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <defs>
          <linearGradient id="lg-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#eed49a" /><stop offset="1" stopColor="#d4a253" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="15" fill={dark ? 'rgba(255,255,255,.06)' : '#0b0f1a'} stroke="rgba(255,255,255,.09)" />
        <path d="M12 44 C20 20 30 16 32 16 C34 16 44 20 52 44" fill="none" stroke="url(#lg-a)" strokeWidth="5" strokeLinecap="round" />
        <path d="M18 44h28" stroke="#8b9fff" strokeWidth="5" strokeLinecap="round" opacity=".85" />
        <circle cx="32" cy="15" r="4" fill="#eed49a" />
      </svg>
      {word && (
        <span className="text-[17px] font-semibold tracking-tight text-white/95">
          Venture<span className="text-grad-gold font-display italic font-medium">Setu</span>
        </span>
      )}
    </span>
  );
}

/* ----------------------------------------------------------------- avatar */
export function Avatar({ name, hue, size = 40, online, ring }: { name: string; hue: number; size?: number; online?: boolean; ring?: boolean }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className={`flex h-full w-full items-center justify-center rounded-full font-semibold text-white/95 ${ring ? 'ring-2 ring-offset-2 ring-offset-ink-950' : ''}`}
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 62% 58%), hsl(${hue + 36} 58% 40%))`,
          fontSize: size * 0.34, letterSpacing: '0.02em',
          ...(ring ? { boxShadow: `0 0 0 2px hsl(${hue} 70% 60% / .8)` } : {}),
        }}
      >
        {initials(name)}
      </span>
      {online !== undefined && (
        <span className={`absolute -bottom-0.5 -right-0.5 h-[26%] w-[26%] min-h-[9px] min-w-[9px] rounded-full border-2 border-ink-950 ${online ? 'bg-emerald-400' : 'bg-slate-500'}`} />
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ buttons */
type BtnVariant = 'accent' | 'outline' | 'ghost' | 'danger' | 'dark';
export function Btn({ variant = 'accent', size = 'md', className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap cursor-pointer';
  const sizes = { sm: 'px-3 py-1.5 text-[12.5px]', md: 'px-4.5 py-2.5 text-[13.5px]', lg: 'px-6 py-3.5 text-[15px]' };
  const variants: Record<BtnVariant, string> = {
    accent: 'a-btn',
    outline: 'border border-white/15 text-white/85 hover:border-white/30 hover:bg-white/[.05] hover:-translate-y-px',
    ghost: 'text-white/70 hover:text-white hover:bg-white/[.06]',
    danger: 'border border-rose-400/30 text-rose-300 hover:bg-rose-400/10',
    dark: 'bg-white/[.06] border border-white/10 text-white/85 hover:bg-white/[.1] hover:-translate-y-px',
  };
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>{children}</button>;
}

/* -------------------------------------------------------------------- card */
export function Card({ className = '', children, hover = false, ...rest }: { className?: string; children: ReactNode; hover?: boolean }) {
  return <div className={`glass rounded-2xl ${hover ? 'lift' : ''} ${className}`} {...rest}>{children}</div>;
}
export function CardHead({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[.06] px-5 py-4">
      <div>
        <h3 className="text-[14px] font-semibold tracking-tight text-white/92">{title}</h3>
        {sub && <p className="mt-0.5 text-[12px] text-white/45">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* -------------------------------------------------------------------- chip */
export function Chip({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'neutral' | 'gold' | 'iris' | 'jade' | 'rose' | 'acc'; className?: string }) {
  const tones = {
    neutral: 'bg-white/[.06] text-white/70 border-white/10',
    gold: 'bg-gold-500/12 text-gold-300 border-gold-500/25',
    iris: 'bg-iris-500/12 text-iris-300 border-iris-500/25',
    jade: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/25',
    rose: 'bg-rose-500/12 text-rose-300 border-rose-500/25',
    acc: 'a-soft',
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium ${tones[tone]} ${className}`}>{children}</span>;
}

/* ----------------------------------------------------------------- tooltip */
export function Tip({ label, children, wide = false }: { label: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span className={`pointer-events-none absolute -top-2 left-1/2 z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-white/12 bg-ink-800/95 px-3 py-2 text-[11.5px] leading-snug text-white/80 opacity-0 shadow-xl backdrop-blur-md transition-all duration-150 group-hover/tip:opacity-100 group-hover/tip:-translate-y-[calc(100%+2px)] ${wide ? 'w-64' : 'whitespace-nowrap'}`}>
        {label}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------- reveal / anim */
export function Reveal({ children, delay = 0, y = 22, className = '' }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay, ease: [0.22, 0.9, 0.3, 1] }}
    >{children}</motion.div>
  );
}

export function AnimatedNumber({ to, format = (n: number) => String(Math.round(n)), duration = 1.4, className = '' }: { to: number; format?: (n: number) => string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-30px' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0; const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / (duration * 1000));
      setVal(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return <span ref={ref} className={`tnum ${className}`}>{format(val)}</span>;
}

/* ------------------------------------------------------------ progress ring */
export function ScoreRing({ score, size = 120, strokeW = 9, label }: { score: number; size?: number; strokeW?: number; label?: string }) {
  const r = (size - strokeW) / 2;
  const c = 2 * Math.PI * r;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.07)" strokeWidth={strokeW} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#ringGrad)" strokeWidth={strokeW} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={inView ? { strokeDashoffset: c - (c * score) / 100 } : {}}
          transition={{ duration: 1.4, ease: [0.22, 0.8, 0.3, 1] }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--acc2, 238 212 154))" />
            <stop offset="100%" stopColor="rgb(var(--acc, 212 162 83))" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber to={score} className="text-[26px] font-bold leading-none text-white" />
        {label && <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">{label}</span>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- progress bar */
export function Bar({ value, tone = 'acc', className = '', thin = false }: { value: number; tone?: 'acc' | 'jade' | 'rose' | 'iris' | 'gold'; className?: string; thin?: boolean }) {
  const colors = {
    acc: 'linear-gradient(90deg, rgb(var(--acc)), rgb(var(--acc2)))',
    jade: 'linear-gradient(90deg,#0e9f6e,#34d399)', rose: 'linear-gradient(90deg,#e35d72,#fb7185)',
    iris: 'linear-gradient(90deg,#5668d9,#8b9fff)', gold: 'linear-gradient(90deg,#b3813c,#eed49a)',
  };
  return (
    <div className={`${thin ? 'h-1' : 'h-2'} w-full overflow-hidden rounded-full bg-white/[.06] ${className}`}>
      <motion.div className="h-full rounded-full" style={{ background: colors[tone] }}
        initial={{ width: 0 }} whileInView={{ width: `${Math.min(100, Math.max(0, value))}%` }} viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 0.8, 0.3, 1] }} />
    </div>
  );
}

/* ----------------------------------------------------------------- fields */
export function Field({ label, hint, children, required }: { label: ReactNode; hint?: ReactNode; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-[12.5px] font-medium text-white/70">
        <span>{label}{required && <span className="ml-0.5 text-gold-400">*</span>}</span>
        {hint && <span className="text-[11px] font-normal text-white/35">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-[14px] text-white/90 placeholder:text-white/28 outline-none transition focus:border-[rgb(var(--acc,212_162_83)/.55)] focus:bg-white/[.06] focus:shadow-[0_0_0_3px_rgb(var(--acc,212_162_83)/.12)] ${props.className ?? ''}`} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full resize-y rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-[14px] text-white/90 placeholder:text-white/28 outline-none transition focus:border-[rgb(var(--acc,212_162_83)/.55)] focus:bg-white/[.06] ${props.className ?? ''}`} />;
}
export function Select({ children, ...props }: InputHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className="w-full appearance-none rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-[14px] text-white/90 outline-none transition focus:border-[rgb(var(--acc,212_162_83)/.55)] [&>option]:bg-ink-850">{children}</select>;
}

/* -------------------------------------------------------------------- tabs */
export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: ReactNode }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-white/[.07] bg-white/[.03] p-1" role="tablist">
      {tabs.map(t => (
        <button key={t.id} role="tab" aria-selected={active === t.id} onClick={() => onChange(t.id)}
          className={`relative rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${active === t.id ? 'text-ink-950' : 'text-white/55 hover:text-white/85'}`}>
          {active === t.id && <motion.span layoutId="tab-pill" className="a-grad absolute inset-0 rounded-lg" transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }} style={{ background: 'linear-gradient(135deg, rgb(var(--acc2)), rgb(var(--acc)))' }} />}
          <span className="relative z-10">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ skeleton */
export function Skel({ className = '' }: { className?: string }) { return <div className={`skel ${className}`} />; }
export function ChartSkeleton() {
  return (
    <div className="space-y-3 p-5" aria-label="Loading chart">
      <Skel className="h-4 w-40" /><Skel className="h-40 w-full" />
      <div className="flex gap-2"><Skel className="h-3 w-16" /><Skel className="h-3 w-16" /><Skel className="h-3 w-16" /></div>
    </div>
  );
}

/* --------------------------------------------------------------------- toast */
type ToastItem = { id: number; msg: string; tone: 'ok' | 'warn' };
let pushToast: (t: ToastItem) => void = () => {};
export function toast(msg: string, tone: 'ok' | 'warn' = 'ok') { pushToast({ id: Date.now() + Math.random(), msg, tone }); }
export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    pushToast = (t) => {
      setItems(p => [...p, t].slice(-4));
      setTimeout(() => setItems(p => p.filter(i => i.id !== t.id)), 4200);
    };
    return () => { pushToast = () => {}; };
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[999] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4" aria-live="polite">
      <AnimatePresence>
        {items.map(i => (
          <motion.div key={i.id} layout initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className="glass-deep pointer-events-auto flex w-auto items-center gap-2.5 rounded-xl px-4 py-3 text-[13px] font-medium text-white/90">
            {i.tone === 'ok' ? <CheckCircle2 size={16} className="shrink-0 text-emerald-400" /> : <AlertTriangle size={16} className="shrink-0 text-amber-400" />}
            {i.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ misc */
export function Delta({ value, invert = false, suffix = '%' }: { value: number; invert?: boolean; suffix?: string }) {
  const good = invert ? value < 0 : value > 0;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-medium ${good ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
      {value > 0 ? '▲' : '▼'} {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
}
export function EmptyState({ icon, title, sub, action }: { icon: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="a-soft mb-1 flex h-12 w-12 items-center justify-center rounded-2xl">{icon}</div>
      <h3 className="text-[15px] font-semibold text-white/90">{title}</h3>
      {sub && <p className="max-w-sm text-[13px] text-white/45">{sub}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', bounce: 0.16, duration: 0.5 }}
            className={`glass-deep relative z-10 max-h-[86vh] w-full overflow-auto rounded-2xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[.07] bg-ink-900/85 px-6 py-4 backdrop-blur-md">
              <h3 className="text-[15px] font-semibold text-white/95">{title}</h3>
              <button onClick={onClose} aria-label="Close" className="rounded-lg px-2 py-1 text-white/50 transition hover:bg-white/[.07] hover:text-white">✕</button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
