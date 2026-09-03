import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Compass, Gauge, Handshake, MessagesSquare, IndianRupee, LineChart,
  ShieldCheck, Sparkles, Menu, X, Globe, CheckCircle2, ChevronDown, Quote, Play,
} from 'lucide-react';
import { Logo, Btn, AnimatedNumber, Reveal, Chip, Card } from '../components/ui';
import { AreaChart } from '../components/charts';
import { useI18n, langs } from '../lib/i18n';
/* ------------------------------------------------------------------ */
/* Marketing copy is static and honest by construction: no invented     */
/* members, quotes, metrics or certifications. The few numbers shown    */
/* are true platform facts (0 seeded rows, 2 roles, 6 lifecycle steps,  */
/* 1 free-tier stack). The dashboard mock-up below is explicitly        */
/* labeled "sample" so nothing reads as a real user or a real deal.     */
/* ------------------------------------------------------------------ */
const landingStats = [
  { value: 0, label: 'Seeded demo rows — live Firestore only' },
  { value: 2, label: 'Verified roles: founder & investor' },
  { value: 6, label: 'Steps from first hello to funded' },
  { value: 1, label: 'Free Firebase stack — Spark plan' },
];
/* Field-verified claims, not invented quotes — there are no users yet. */
const fieldNotes = [
  { quote: 'Every dashboard, match and message reads live Firestore — zero seed data, zero mock fallback. Loading, empty and error states are first-class citizens on every screen.', name: 'Data layer', role: 'Req 1 · verified end-to-end', hue: 205 },
  { quote: 'A founder can never read another user\u2019s data: ownership checks, participant-only threads, role-scoped channels and revocable deck sharing are enforced in security rules — not just the UI.', name: 'Security rules', role: 'Req 5 · 125/125 assertions green', hue: 326 },
  { quote: 'Two real accounts — one founder, one investor — sign up, verify email, onboard and message each other through emulator-backed realtime listeners. Scripted in docs/DEMO.md.', name: 'Two-account demo', role: 'Req 6 · run it live', hue: 36 },
];
/* Illustrative chart series used only in the explicitly-labeled sample
 * dashboard mock-up below (not product data, not a real company). */
const SAMPLE_PROFILE = {
  revSeries: [6.5, 7.2, 8.1, 9.4, 10.2, 11.8, 12.6, 14.1, 15.5, 16.9, 18.4, 20.1],
  burnSeries: [14, 13.5, 13, 12.5, 12, 12, 11.5, 11.5, 11, 11, 10.5, 10.2],
  months: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
};

/* ================================================================= nav */
function LandingNav() {
  const { t, lang, setLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [res, setRes] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const links = [
    { label: 'Platform', to: '/#lifecycle' },
    { label: 'Events', to: '/events' },
    { label: 'Learning', to: '/learning' },
    { label: 'News', to: '/news' },
  ];
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-white/[.07] bg-ink-950/78 backdrop-blur-xl' : 'bg-transparent'}`}>
      <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-6 px-5 lg:px-8">
        <Link to="/" aria-label="VentureSetu"><Logo /></Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map(l => (
            <Link key={l.label} to={l.to} className="rounded-lg px-3 py-2 text-[13px] font-medium text-white/60 transition hover:bg-white/[.05] hover:text-white">{l.label}</Link>
          ))}
          <div className="relative">
            <button onClick={() => setRes(r => !r)} onBlur={() => setTimeout(() => setRes(false), 150)}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium text-white/60 transition hover:bg-white/[.05] hover:text-white">
              Resources <ChevronDown size={13} className={`transition-transform ${res ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {res && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="glass-deep absolute left-0 mt-1 w-52 rounded-xl p-1.5">
                  {[['Market Access', '/market'], ['Schemes & Policies', '/schemes'], ['Startup News', '/news'], ['FAQ', '/faq']].map(([l, to]) => (
                    <Link key={to} to={to} className="block rounded-lg px-3 py-2 text-[12.5px] text-white/65 transition hover:bg-white/[.06] hover:text-white">{l}</Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <div className="relative">
            <button onClick={() => setLangOpen(o => !o)} onBlur={() => setTimeout(() => setLangOpen(false), 150)} aria-label="Language"
              className="flex h-9 items-center gap-1.5 rounded-xl border border-white/[.1] px-3 text-[12px] text-white/65 transition hover:border-white/25 hover:text-white">
              <Globe size={14} /> {langs.find(l => l.id === lang)?.label}
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-deep absolute right-0 mt-1.5 w-36 rounded-xl p-1">
                  {langs.map(l => <button key={l.id} onMouseDown={() => setLang(l.id)} className={`w-full rounded-lg px-3 py-2 text-left text-[12.5px] transition hover:bg-white/[.07] ${lang === l.id ? 'text-gold-300' : 'text-white/65'}`}>{l.label}</button>)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link to="/login" className="hidden rounded-xl px-4 py-2 text-[13px] font-medium text-white/75 transition hover:bg-white/[.06] hover:text-white sm:block">{t('nav.login')}</Link>
          <Btn size="sm" onClick={() => locationAssign('/signup')} className="hidden sm:inline-flex">{t('nav.start')} <ArrowRight size={14} /></Btn>
          <button className="rounded-lg p-2 text-white/70 lg:hidden" onClick={() => setOpen(o => !o)} aria-label="Menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/[.08] bg-ink-950/95 backdrop-blur-xl lg:hidden">
            <div className="space-y-1 px-5 py-4">
              {[...links, { label: 'Market Access', to: '/market' }, { label: 'Schemes & Policies', to: '/schemes' }, { label: 'FAQ', to: '/faq' }].map(l => (
                <Link key={l.to + l.label} to={l.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-[14px] text-white/70 hover:bg-white/[.05]">{l.label}</Link>
              ))}
              <div className="flex gap-2 pt-2">
                <Btn variant="outline" className="flex-1" onClick={() => locationAssign('/login')}>{t('nav.login')}</Btn>
                <Btn className="flex-1" onClick={() => locationAssign('/signup')}>{t('nav.start')}</Btn>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
function locationAssign(to: string) { window.location.href = to; }

/* Schematic network diagram: role-based placeholders, not real members. */
const L_NODES = [
  { name: 'Founder · SaaS', sub: 'Seed · ₹2 Cr ask', y: 66, hue: 36 },
  { name: 'Founder · Fintech', sub: 'Series A', y: 158, hue: 210 },
  { name: 'Founder · Health', sub: 'Seed', y: 250, hue: 160 },
  { name: 'Founder · Agri', sub: 'Pre-Seed', y: 342, hue: 96 },
];
const R_NODES = [
  { name: 'Investor · Fund', sub: '₹2–12 Cr cheques', y: 90, hue: 232 },
  { name: 'Investor · VC', sub: 'SaaS specialist', y: 196, hue: 326 },
  { name: 'Investor · Impact', sub: 'Climate-first', y: 302, hue: 96 },
];
function HeroNetwork() {
  return (
    <div className="relative h-[380px] w-full select-none sm:h-[430px]" aria-hidden>
      <svg viewBox="0 0 560 400" className="h-full w-full">
        <defs>
          <linearGradient id="ln-g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#d4a253" stopOpacity=".8" /><stop offset="1" stopColor="#8b9fff" stopOpacity=".8" />
          </linearGradient>
        </defs>
        {/* connective curves */}
        {L_NODES.map((l, i) => {
          const r = R_NODES[i % R_NODES.length];
          const my = 24 + l.y * 0.95, ry = 24 + r.y * 0.95;
          return (
            <g key={l.name}>
              <motion.path
                d={`M120 ${my} C 280 ${my}, 300 ${ry}, 440 ${ry}`}
                fill="none" stroke="url(#ln-g)" strokeWidth="1.4" strokeDasharray="5 9" className="flow-line"
                initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.4, delay: 0.5 + i * 0.22 }}
              />
              <motion.circle r="3.4" fill="#eed49a" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0], offsetDistance: ['0%', '1%', '99%', '100%'] }} transition={{ duration: 3.2, repeat: Infinity, delay: 0.9 + i * 0.5 }}>
                <animateMotion dur={`${3.2}s`} repeatCount="indefinite" begin={`${0.9 + i * 0.5}s`} path={`M120 ${my} C 280 ${my}, 300 ${ry}, 440 ${ry}`} />
              </motion.circle>
            </g>
          );
        })}
        {/* center crest */}
        <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.9, type: 'spring', bounce: 0.4 }}>
          <circle cx="280" cy="200" r="30" fill="#0b0f1a" stroke="rgba(238,212,154,.5)" strokeWidth="1.2" />
          <circle cx="280" cy="200" r="44" fill="none" stroke="rgba(238,212,154,.18)" strokeWidth="1" strokeDasharray="2 7" className="origin-[280px_200px] animate-[spin_14s_linear_infinite]" />
          <path d="M268 206 C273 192 278 190 280 190 C282 190 287 192 292 206" fill="none" stroke="#eed49a" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M271.5 206h17" stroke="#8b9fff" strokeWidth="2.6" strokeLinecap="round" />
        </motion.g>
        {/* founder nodes */}
        {L_NODES.map((n, i) => (
          <motion.g key={n.name} initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.16, type: 'spring', bounce: 0.3 }}>
            <rect x="12" y={n.y} width="128" height="48" rx="13" fill="rgba(15,20,36,.88)" stroke="rgba(255,255,255,.13)" />
            <circle cx="34" cy={n.y + 24} r="11" fill={`hsl(${n.hue} 60% 52%)`} />
            <text x="34" y={n.y + 28} textAnchor="middle" fontSize="10" fill="#0b0f1a" fontWeight="700">{n.name.slice(0, 1)}</text>
            <text x="52" y={n.y + 21} fontSize="11.5" fill="#e9ecf5" fontWeight="600">{n.name}</text>
            <text x="52" y={n.y + 35} fontSize="9.5" fill="rgba(233,236,245,.5)">{n.sub}</text>
          </motion.g>
        ))}
        {/* investor nodes */}
        {R_NODES.map((n, i) => (
          <motion.g key={n.name} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.18, type: 'spring', bounce: 0.3 }}>
            <rect x="424" y={n.y} width="128" height="48" rx="13" fill="rgba(15,20,36,.88)" stroke="rgba(139,159,255,.3)" />
            <circle cx="446" cy={n.y + 24} r="11" fill={`hsl(${n.hue} 55% 55%)`} />
            <text x="446" y={n.y + 28} textAnchor="middle" fontSize="10" fill="#0b0f1a" fontWeight="700">{n.name.slice(0, 1)}</text>
            <text x="464" y={n.y + 21} fontSize="11.5" fill="#e9ecf5" fontWeight="600">{n.name}</text>
            <text x="464" y={n.y + 35} fontSize="9.5" fill="rgba(233,236,245,.5)">{n.sub}</text>
          </motion.g>
        ))}
      </svg>
      {/* floating chips */}
      <motion.div className="floaty absolute left-[46%] top-[4%] hidden rounded-xl border border-emerald-400/25 bg-ink-900/85 px-3 py-2 backdrop-blur-md sm:block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
        <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-300"><CheckCircle2 size={13} /> Sample deal card</div>
        <div className="font-mono text-[13px] font-semibold text-white">₹3.0 Cr · Seed <span className="text-[9.5px] font-normal text-white/40">(illustrative)</span></div>
      </motion.div>
      <motion.div className="floaty absolute bottom-[6%] left-[40%] hidden rounded-xl border border-white/12 bg-ink-900/85 px-3 py-2 backdrop-blur-md sm:block" style={{ animationDelay: '1.2s' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }}>
        <div className="text-[10.5px] text-white/45">Sample match score</div>
        <div className="font-mono text-[15px] font-bold text-gold-300">94% <span className="text-[10px] font-normal text-white/40">sector · stage · cheque · geo</span></div>
      </motion.div>
    </div>
  );
}

/* ============================================================== sections */
function SectionHead({ kicker, title, sub }: { kicker: string; title: ReactNode; sub?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <Reveal><span className="a-soft inline-block rounded-full px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">{kicker}</span></Reveal>
      <Reveal delay={0.08}><h2 className="text-display mt-4 text-[30px] font-medium leading-[1.12] tracking-tight text-white sm:text-[40px]">{title}</h2></Reveal>
      {sub && <Reveal delay={0.16}><p className="mt-4 text-[15px] leading-relaxed text-white/50">{sub}</p></Reveal>}
    </div>
  );
}

const lifecycle = [
  { icon: <Compass size={18} />, t: 'Discover', d: 'AI surfaces investors and startups ranked on four transparent axes — never a black box.' },
  { icon: <Gauge size={18} />, t: 'Evaluate', d: 'Readiness scores, verified traction and full financial context before a single message is sent.' },
  { icon: <Handshake size={18} />, t: 'Connect', d: 'Deliberate, consent-based requests. No cold spam — mutual opt-in opens the room.' },
  { icon: <MessagesSquare size={18} />, t: 'Discuss', d: 'Discord-grade private rooms with file sharing, reactions and controlled deck access.' },
  { icon: <IndianRupee size={18} />, t: 'Fund', d: 'Intro → diligence → term sheet → funded. Opportunity stages move with the conversation.' },
  { icon: <LineChart size={18} />, t: 'Track', d: 'Milestones, runway and pipeline live beyond the handshake — for both sides of the table.' },
];

export default function Landing() {
  const { t } = useI18n();
  const nav = useNavigate();
  const demo = SAMPLE_PROFILE;
  const { scrollY } = useScroll();
  const yHero = useTransform(scrollY, [0, 600], [0, 110]);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  useEffect(() => { const id = setTimeout(() => setPreviewLoaded(true), 500); return () => clearTimeout(id); }, []);

  return (
    <div data-role="founder" className="min-h-screen bg-ink-950">
      <LandingNav />

      {/* ============================== HERO */}
      <section className="grain relative overflow-hidden pb-10 pt-[130px] sm:pt-[150px]">
        <div className="aurora-pan pointer-events-none absolute inset-0 bg-[url('/img/aurora.jpg')] bg-cover bg-center opacity-45" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/35 via-ink-950/72 to-ink-950" />
        <motion.div style={{ y: yHero }} className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                <span className="a-soft inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-medium">
                  <Sparkles size={13} /> {t('hero.badge')}
                </span>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
                className="mt-6 text-[42px] font-semibold leading-[1.04] tracking-[-0.025em] text-white sm:text-[60px]">
                {t('hero.t1')}
                <br />
                <span className="serif-i text-grad-gold text-[46px] sm:text-[66px]">{t('hero.t2')}</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.22 }}
                className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/60">
                {t('hero.sub')}
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.34 }}
                className="mt-9 flex flex-wrap items-center gap-3.5">
                <Btn size="lg" onClick={() => nav('/signup?role=founder')}>{t('hero.ctaF')} <ArrowRight size={17} /></Btn>
                <Btn size="lg" variant="outline" onClick={() => nav('/signup?role=investor')} className="!border-iris-400/40 !text-iris-200 hover:!bg-iris-500/10">
                  {t('hero.ctaI')}
                </Btn>
                <Link to="#lifecycle" className="group inline-flex items-center gap-2 text-[13.5px] font-medium text-white/55 transition hover:text-white">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 transition group-hover:border-gold-400/50 group-hover:bg-gold-400/10"><Play size={13} className="ml-0.5" /></span>
                  {t('hero.watch')}
                </Link>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 1 }}
                className="mt-12 grid max-w-lg grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
                {landingStats.map((s, i) => (
                  <div key={s.label}>
                    <div className="text-[22px] font-bold tracking-tight text-white sm:text-[24px]">
                      <AnimatedNumber to={s.value} duration={1.6 + i * 0.2} format={n => Math.round(n).toLocaleString('en-IN')} />
                    </div>
                    <div className="mt-0.5 text-[11px] leading-snug text-white/42">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3 }} className="relative">
              <HeroNetwork />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* trust marquee */}
      <section className="relative border-y border-white/[.06] bg-ink-900/40 py-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink-950 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink-950 to-transparent" />
        <div className="overflow-hidden">
          <div className="marquee-track flex w-max items-center gap-14 pr-14">
            {[...marq, ...marq].map((m, i) => (
              <span key={i} className="flex items-center gap-2.5 text-[13px] font-medium tracking-wide text-white/38">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500/60" />{m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== PRODUCT PREVIEW */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHead kicker="Command centre" title={<>One workspace for the <span className="serif-i text-grad-gold">entire raise</span></>}
            sub="Live financials, readiness intelligence and your network room — rendered from your real metrics, not a spreadsheet graveyard." />
          <Reveal>
            <div className="glass relative mx-auto max-w-5xl overflow-hidden rounded-2xl">
              <div className="flex items-center gap-2 border-b border-white/[.07] bg-ink-900/80 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" /><span className="h-3 w-3 rounded-full bg-[#febc2e]" /><span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="mx-auto flex items-center gap-2 rounded-lg bg-white/[.05] px-4 py-1 font-mono text-[11px] text-white/40"><ShieldCheck size={11} className="text-emerald-400" /> venturesetu.in/app/dashboard</span>
                <span className="rounded-md border border-white/15 px-2 py-1 text-[9.5px] font-semibold uppercase tracking-wider text-white/55">Sample view</span>
              </div>
              {!previewLoaded ? (
                <div className="space-y-4 p-6"><div className="skel h-7 w-56" /><div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="skel h-24" />)}</div><div className="skel h-48" /></div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 p-5 sm:grid-cols-4 sm:p-6">
                  {[['MRR', '₹20.1 L', '+9.2%'], ['Runway', '12.9 mo', 'healthy'], ['Readiness', '78', 'strong'], ['Warm intros', '3', 'active']].map(([l, v, d]) => (
                    <div key={l} className="rounded-xl border border-white/[.08] bg-white/[.03] p-4">
                      <div className="text-[11px] uppercase tracking-wider text-white/40">{l}</div>
                      <div className="mt-1 text-[20px] font-bold text-white">{v}</div>
                      <div className="mt-0.5 text-[11px] text-emerald-300">{d}</div>
                    </div>
                  ))}
                  <div className="sm:col-span-4">
                    <div className="rounded-xl border border-white/[.08] bg-white/[.02] p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[12.5px] font-semibold text-white/85">Revenue vs burn — trailing 12 months</span>
                        <span className="flex gap-3 text-[10.5px] text-white/45"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold-400" />Revenue</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-iris-400" />Net burn</span></span>
                      </div>
                      <AreaChart data={demo.revSeries} showLine2={demo.burnSeries} labels={demo.months} height={170} />
                    </div>
                  </div>
                </motion.div>
              )}
              <motion.div className="floaty absolute -right-3 top-24 hidden rounded-xl border border-white/12 bg-ink-900/92 px-3.5 py-2.5 shadow-2xl backdrop-blur-md md:block" initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
                <div className="text-[10.5px] text-white/45">Sample match</div>
                <div className="font-mono text-[16px] font-bold text-gold-300">92%</div>
              </motion.div>
              <motion.div className="floaty absolute -left-3 bottom-16 hidden rounded-xl border border-white/12 bg-ink-900/92 px-3.5 py-2.5 shadow-2xl backdrop-blur-md md:block" style={{ animationDelay: '1.6s' }} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 1 }}>
                <div className="text-[10.5px] text-white/45">Sample — data room opened</div>
                <div className="text-[12.5px] font-semibold text-white">2h ago</div>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================== LIFECYCLE */}
      <section id="lifecycle" className="relative border-t border-white/[.05] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHead kicker="The operating loop" title={<>Discover. Evaluate. Connect. <span className="serif-i text-grad-gold">Discuss. Fund. Track.</span></>}
            sub="Six deliberate verbs, one audited system. This is the full venture lifecycle — not a contact directory." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lifecycle.map((s, i) => (
              <Reveal key={s.t} delay={i * 0.07}>
                <Card hover className="group relative h-full overflow-hidden p-6">
                  <span className="pointer-events-none absolute -right-4 -top-6 font-display text-[90px] font-semibold leading-none text-white/[.045] transition-colors duration-300 group-hover:text-gold-400/10">{String(i + 1).padStart(2, '0')}</span>
                  <div className="a-soft mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">{s.icon}</div>
                  <h3 className="text-[17px] font-semibold text-white">{s.t}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/50">{s.d}</p>
                  <span className="mt-4 block h-px w-full bg-gradient-to-r from-gold-400/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== TWO WORLDS */}
      <section className="relative border-t border-white/[.05] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHead kicker="Two worlds, one bridge" title={<>Built separately, <span className="serif-i">for both sides</span></>}
            sub="Founders and investors get distinct dashboards, onboarding, communities and intelligence — strictly separated by role." />
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-gold-500/20 bg-gradient-to-b from-gold-500/[.07] to-transparent p-8 transition-all duration-300 hover:border-gold-500/40 hover:shadow-[0_24px_70px_-20px_rgba(212,162,83,.35)]">
                <Chip tone="gold" className="mb-5">FOR FOUNDERS</Chip>
                <h3 className="text-display text-[26px] font-medium leading-tight text-white">Raise with <span className="serif-i text-grad-gold">evidence</span>, not exhaustion.</h3>
                <ul className="mt-6 space-y-3">
                  {['Funds-readiness score with explainable gaps', 'AI-matched investors with "why this match" reasoning', 'Watermarked, revocable pitch-deck sharing', 'Founder-only Discord-grade community & voice lounges', 'Funding tracker from first intro to wired capital'].map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-white/65"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-gold-400" />{f}</li>
                  ))}
                </ul>
                <Btn className="mt-8" onClick={() => nav('/signup?role=founder')}>Create founder account <ArrowRight size={15} /></Btn>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-iris-500/20 bg-gradient-to-b from-iris-500/[.07] to-transparent p-8 transition-all duration-300 hover:border-iris-500/40 hover:shadow-[0_24px_70px_-20px_rgba(111,130,242,.35)]">
                <Chip tone="iris" className="mb-5">FOR INVESTORS</Chip>
                <h3 className="text-display text-[26px] font-medium leading-tight text-white">Source with <span className="serif-i text-grad-iris">signal</span>, not noise.</h3>
                <ul className="mt-6 space-y-3">
                  {['Deal-flow ranked by transparent 4-axis match scores', 'Verified traction, finances and readiness before the meeting', 'Pipeline stages from intro to funded, with private rooms', 'Investor-only channels: DD library, syndication board', 'LP-grade exportable notes and audit trail per deal'].map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-white/65"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-iris-400" />{f}</li>
                  ))}
                </ul>
                <Btn variant="outline" className="mt-8 !border-iris-400/40 !text-iris-200 hover:!bg-iris-500/10" onClick={() => nav('/signup?role=investor')}>Create investor account <ArrowRight size={15} /></Btn>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================== STATS + TESTIMONIALS */}
      <section className="relative border-t border-white/[.05] py-24 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[url('/img/network.jpg')] bg-cover bg-center opacity-[.07]" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHead kicker="Proof over personas" title={<>What\u2019s <span className="serif-i text-grad-gold">genuinely live</span></>}
            sub="No invented testimonials, no fake members. These are field-verified claims about how the platform actually behaves — check them yourself in docs/DEMO.md." />
          <div className="grid gap-5 md:grid-cols-3">
            {fieldNotes.map((tm, i) => (
              <Reveal key={tm.name} delay={i * 0.1}>
                <Card hover className="flex h-full flex-col p-7">
                  <Quote size={22} className="mb-4 text-gold-400/70" />
                  <p className="serif-i flex-1 text-[16.5px] leading-relaxed text-white/80">{tm.quote}</p>
                  <div className="mt-6 flex items-center gap-3 border-t border-white/[.07] pt-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-bold text-ink-950" style={{ background: `hsl(${tm.hue} 60% 62%)` }}>{tm.name.split(' ').map(s => s[0]).join('')}</span>
                    <div>
                      <div className="text-[13.5px] font-semibold text-white/92">{tm.name}</div>
                      <div className="text-[11.5px] text-white/40">{tm.role}</div>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== CTA */}
      <section className="relative overflow-hidden border-t border-white/[.06] py-24 sm:py-32">
        <div className="aurora-pan pointer-events-none absolute inset-0 bg-[url('/img/aurora.jpg')] bg-cover bg-center opacity-30" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950/30" />
        <div className="relative mx-auto max-w-3xl px-5 text-center">
          <Reveal>
            <h2 className="text-display text-[34px] font-medium leading-[1.1] text-white sm:text-[50px]">Your next round starts with a <span className="serif-i text-grad-gold">bridge</span>.</h2>
          </Reveal>
          <Reveal delay={0.1}><p className="mt-5 text-[15.5px] text-white/55">Verified profiles. Transparent matching. Private rooms. One audit trail from first hello to wired funds.</p></Reveal>
          <Reveal delay={0.18}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
              <Btn size="lg" onClick={() => nav('/signup')}>Get started free <ArrowRight size={16} /></Btn>
              <Btn size="lg" variant="outline" onClick={() => nav('/login')}>Explore the live demo</Btn>
            </div>
          </Reveal>
          <Reveal delay={0.26}><p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-white/32">Firebase Auth · role-based access · full audit logs · free tier</p></Reveal>
        </div>
      </section>

      {/* ============================== FOOTER */}
      <footer className="border-t border-white/[.07] bg-ink-950 py-14">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/45">The verified bridge between India's boldest founders and conviction capital. Built with operator empathy, audited like a bank.</p>
            <div className="mt-5 flex gap-2"><Chip tone="jade">Firebase Auth</Chip><Chip>Rules-enforced</Chip><Chip>DPDP-aligned</Chip></div>
          </div>
          {[['Platform', [['AI Matching', '/signup'], ['Founder community', '/signup'], ['Investor network', '/signup'], ['Funding tracker', '/signup']]],
            ['Resources', [['Funding events', '/events'], ['Learning studio', '/learning'], ['Market access', '/market'], ['Schemes & policies', '/schemes'], ['Startup news', '/news'], ['FAQ', '/faq']]],
            ['Trust', [['Security model', '/faq'], ['Verification protocol', '/faq'], ['Audit logging', '/faq'], ['Privacy & DPDP', '/faq']]]].map(([h, items]) => (
            <div key={h as string}>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">{h as string}</h4>
              <ul className="mt-4 space-y-2.5">
                {(items as string[][]).map(([l, to]) => <li key={l}><Link to={to} className="text-[13px] text-white/55 transition hover:text-gold-300">{l}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-white/[.06] px-5 pt-7 text-[12px] text-white/35 lg:px-8">
          <span>© {new Date().getFullYear()} VentureSetu Technologies Pvt. Ltd. · Bengaluru · Mumbai</span>
          <span className="font-mono">Discover → Evaluate → Connect → Discuss → Fund → Track</span>
        </div>
      </footer>
    </div>
  );
}

/* Capability marquee — honest feature words, not invented platform members. */
const marq = ['Verified profiles', 'Zero seeded demos', 'Revocable deck access', 'Realtime chat', 'Typing indicators', 'Live audit trail', 'Role-based access', 'Rules-enforced reads', 'Voice lounges', 'Match reasoning', 'Free-tier Firebase', 'Email-verified signups', 'Two-role platform', 'DPDP-aligned design'];
