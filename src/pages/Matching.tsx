import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Search, ChevronDown, Send, CheckCheck, MessageSquare, BadgeCheck, Eye, TrendingUp, X } from 'lucide-react';
import { Card, Chip, Btn, ScoreRing, Avatar, Modal, Textarea, toast, Tip, EmptyState } from '../components/ui';
import { AxisBars } from '../components/charts';
import { useApp, activeStartup } from '../lib/store';
import { rankMatches, rankStartups } from '../lib/match';
import { fmtL } from '../lib/format';
import type { Investor, Startup, Match } from '../lib/types';

export function ConnectModal({ open, onClose, name, targetId }: { open: boolean; onClose: () => void; name: string; targetId: string }) {
  const { sendConnection } = useApp();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const templates = [
    'Sharing our deck + readiness report — your thesis maps closely to what we\u2019re building.',
    '30 minutes to walk you through our metrics and data room?',
    'We\u2019re closing our round this quarter — your mandate fits; worth a first call?',
  ];
  return (
    <Modal open={open} onClose={onClose} title={`Connection request · ${name}`}>
      <p className="mb-4 text-[12.5px] leading-relaxed text-white/50">A short, specific note triples acceptance rates. Your full profile and (if enabled) pitch deck travel with the request.</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {templates.map(tp => <button key={tp} onClick={() => setMsg(tp)} className="rounded-lg border border-white/10 bg-white/[.03] px-2.5 py-1.5 text-left text-[11px] text-white/55 transition hover:border-white/30 hover:text-white/85">{tp}</button>)}
      </div>
      <Textarea rows={4} value={msg} onChange={e => setMsg(e.target.value)} placeholder="Why you, why them, why now — in three lines…" autoFocus />
      <div className="mt-5 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn disabled={msg.trim().length < 12 || busy} onClick={async () => {
          setBusy(true);
          const r = await sendConnection(targetId, msg.trim());
          setBusy(false);
          if ('err' in r) { toast(r.err, 'warn'); return; }
          toast(r.ok); onClose();
        }}>{busy ? 'Sending…' : <><Send size={14} /> Send request</>}</Btn>
      </div>
    </Modal>
  );
}

function MatchCard({ rank, name, sub, hue, online, match, meta, profileTo, onConnect, connState, roomTo, extra }: {
  rank: number; name: string; sub: string; hue: number; online?: boolean; match: Match; meta: { label: string; value: string }[];
  profileTo: string; onConnect: () => void; connState: 'none' | 'pending' | 'accepted'; roomTo?: string; extra?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const m = match;
  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.4, ease: [0.22, 0.8, 0.3, 1] }}>
      <Card className={`overflow-hidden transition-shadow ${open ? 'shadow-[0_24px_70px_-22px_rgb(var(--acc)/.28)]' : ''}`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4.5">
          <span className="w-7 text-center font-mono text-[12.5px] text-white/28">#{rank}</span>
          <Link to={profileTo} className="flex min-w-0 flex-1 items-center gap-3.5">
            <Avatar name={name} hue={hue} size={46} online={online} />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-[15px] font-semibold text-white">{name} <BadgeCheck size={14} className="a-text shrink-0" /></span>
              <span className="block truncate text-[12.5px] text-white/45">{sub}</span>
            </span>
          </Link>
          <div className="hidden items-center gap-5 md:flex">
            {meta.map(mi => (
              <div key={mi.label} className="text-right">
                <div className="font-mono text-[13.5px] font-semibold text-white/88">{mi.value}</div>
                <div className="text-[9.5px] uppercase tracking-wider text-white/32">{mi.label}</div>
              </div>
            ))}
          </div>
          <Tip label={m.signal} wide>
            <div><ScoreRing score={m.score} size={58} strokeW={5.5} /><div className="mt-0.5 text-center text-[9px] font-semibold uppercase tracking-widest text-white/35">match</div></div>
          </Tip>
          <div className="flex items-center gap-2">
            {connState === 'none' && <Btn size="sm" onClick={onConnect}><Send size={13} /> Connect</Btn>}
            {connState === 'pending' && <Chip tone="gold"><CheckCheck size={12} /> Requested</Chip>}
            {connState === 'accepted' && roomTo && <Link to={roomTo}><Btn size="sm" variant="outline"><MessageSquare size={13} /> Open room</Btn></Link>}
            <Link to={profileTo}><Btn size="sm" variant="ghost"><Eye size={13} /></Btn></Link>
            <button onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label="Why this match"
              className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/55 transition hover:border-white/25 hover:text-white ${open ? 'a-soft' : ''}`}>
              <ChevronDown size={15} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
        {extra}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 0.8, 0.3, 1] }} className="overflow-hidden">
              <div className="grid gap-6 border-t border-white/[.06] bg-white/[.02] px-5 py-5 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/40"><Sparkles size={13} className="a-text" /> Compatibility matrix</h4>
                  <AxisBars rows={[
                    { label: 'Sector fit', value: m.sector, note: m.sector >= 0.9 ? 'Direct alignment with core thesis' : m.sector >= 0.5 ? 'Adjacent — maps to a thesis pillar' : 'Outside core sectors' },
                    { label: 'Stage fit', value: m.stage, note: m.stage >= 0.9 ? 'Squarely inside mandate stages' : m.stage >= 0.5 ? 'One stage off mandate centre' : 'Stage gap — track first' },
                    { label: 'Cheque range', value: m.cheque, note: m.cheque >= 0.9 ? 'Ask sits within stated cheque band' : 'Ask is outside the band — negotiate structure' },
                    { label: 'Geography', value: m.geo, note: m.geo >= 0.9 ? 'Covered by stated geography' : 'Outside named coverage, open remote' },
                  ]} />
                </div>
                <div>
                  <h4 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/40">Why this match?</h4>
                  <ul className="space-y-2">
                    {m.reasons.map((r, i) => (
                      <motion.li key={r} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.07 }}
                        className="flex items-start gap-2.5 rounded-lg border border-white/[.06] bg-white/[.03] px-3 py-2 text-[12.5px] leading-snug text-white/70">
                        <TrendingUp size={13} className="mt-0.5 shrink-0 a-text" />{r}
                      </motion.li>
                    ))}
                  </ul>
                  <p className="mt-3 rounded-lg border border-dashed border-white/12 px-3 py-2 text-[11px] text-white/40">{m.signal} · scores re-computed whenever either side updates their profile.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

function VentureChip() {
  const { db, user, setFocusStartup } = useApp();
  const owned = db.startups.filter(s => s.ownerId === user?.id);
  const cur = activeStartup(db, user);
  if (owned.length <= 1 || !cur) return <b className="a-text font-semibold">{cur?.name}</b>;
  return (
    <select value={cur.id} onChange={e => { setFocusStartup(e.target.value); toast(`Now scoring against ${owned.find(o => o.id === e.target.value)?.name}`); }} aria-label="Active venture"
      className="cursor-pointer rounded-lg border border-[rgb(var(--acc)/.4)] bg-white/[.05] px-2 py-0.5 text-[12.5px] font-semibold a-text outline-none [&>option]:bg-ink-850">
      {owned.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  );
}

export default function Matching() {
  const { db, user } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [minScore, setMinScore] = useState(40);
  const [sector, setSector] = useState('All');
  const [modal, setModal] = useState<{ id: string; name: string } | null>(null);
  const isFounder = user?.role === 'founder';

  const ownSt = activeStartup(db, user);
  const meInv = db.investors.find(i => i.userId === user?.id);

  const rows = useMemo(() => {
    let base: { kind: 'inv'; inv: Investor; m: Match }[] | { kind: 'st'; st: Startup; m: Match }[] = [];
    if (isFounder) {
      if (!ownSt) return [];
      base = rankMatches(ownSt, db.investors).map(r => ({ kind: 'inv' as const, inv: r.inv, m: r.m }));
    } else {
      if (!meInv) return [];
      base = rankStartups(meInv, db.startups).map(r => ({ kind: 'st' as const, st: r.st, m: r.m }));
    }
    return base.filter(r => {
      const name = r.kind === 'inv' ? r.inv.name + r.inv.firm : r.st.name + r.st.sector;
      const sec = r.kind === 'inv' ? null : r.st.sector;
      if (q && !name.toLowerCase().includes(q.toLowerCase())) return false;
      if (r.m.score < minScore) return false;
      if (sector !== 'All') {
        if (r.kind === 'inv') { if (!r.inv.sectors.includes(sector)) return false; }
        else if (sec !== sector) return false;
      }
      return true;
    });
  }, [isFounder, ownSt, meInv, db, q, minScore, sector]);

  const sectors = useMemo(() => {
    const set = new Set<string>();
    if (isFounder) db.investors.forEach(i => i.sectors.forEach(s => set.add(s)));
    else db.startups.forEach(s => set.add(s.sector));
    return ['All', ...Array.from(set)];
  }, [db, isFounder]);

  const connStateFor = (targetId: string): { state: 'none' | 'pending' | 'accepted'; roomTo?: string } => {
    const conn = db.connections.find(c => isFounder
      ? c.investorId === targetId && c.startupId === ownSt?.id
      : c.startupId === targetId && c.investorId === meInv?.id);
    if (!conn) return { state: 'none' };
    const th = db.threads.find(t => t.connId === conn.id);
    return { state: conn.status === 'accepted' ? 'accepted' : 'pending', roomTo: th ? `/app/messages/${th.id}` : undefined };
  };

  const ex = useMemo(() => rows.filter(r => r.m.score >= 80).length, [rows]);

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-[24px] font-bold tracking-tight text-white sm:text-[27px]">
            <span className="a-soft flex h-10 w-10 items-center justify-center rounded-xl"><Sparkles size={18} /></span>
            AI Matching
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-white/45">
            {isFounder ? (<span className="flex items-center gap-2">Investors scored against <VentureChip /> — transparent on all four axes.</span>) : `Startups ranked against your ${meInv?.firm ?? 'investor'} mandate.`}
          </p>
        </div>
        <div className="flex gap-6">
          <div className="text-right"><div className="font-mono text-[22px] font-bold a-text">{ex}</div><div className="text-[10.5px] uppercase tracking-wider text-white/35">≥80% matches</div></div>
          <div className="text-right"><div className="font-mono text-[22px] font-bold text-white/85">{rows.length}</div><div className="text-[10.5px] uppercase tracking-wider text-white/35">in view</div></div>
        </div>
      </div>

      {/* controls */}
      <Card className="mb-5 flex flex-wrap items-center gap-3 px-4 py-3.5">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={isFounder ? 'Search investors or funds…' : 'Search startups…'}
            className="w-full rounded-lg border border-white/10 bg-white/[.04] py-2 pl-9 pr-3 text-[13px] outline-none transition focus:border-white/25" aria-label="Search matches" />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] uppercase tracking-wider text-white/35">Min score</span>
          <input type="range" min={20} max={95} step={5} value={minScore} onChange={e => setMinScore(+e.target.value)} className="w-28 accent-[#d4a253]" aria-label="Minimum match score" />
          <span className="w-10 font-mono text-[12px] a-text">{minScore}%</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sectors.slice(0, 8).map(s => (
            <button key={s} onClick={() => setSector(s)} aria-pressed={sector === s}
              className={`rounded-full border px-3 py-1 text-[11.5px] font-medium transition ${sector === s ? 'a-soft' : 'border-white/10 text-white/50 hover:border-white/25 hover:text-white/80'}`}>{s}</button>
          ))}
        </div>
      </Card>

      {isFounder && !ownSt && (
        <Card><EmptyState icon={<Sparkles size={18} />} title="Create a startup profile first" sub="Matching scores your live startup profile against every verified investor." action={<Link to="/app/startup/own"><Btn size="sm">Set up my startup</Btn></Link>} /></Card>
      )}
      {!isFounder && !meInv && (
        <Card><EmptyState icon={<Sparkles size={18} />} title="Finish your investor profile" sub="Matching ranks startups against your live mandate." action={<Link to="/app/profile"><Btn size="sm">Open my profile</Btn></Link>} /></Card>
      )}

      <AnimatePresence mode="popLayout">
        <div className="space-y-3.5">
          {rows.map((r, i) => r.kind === 'inv' ? (
            <InvCard key={r.inv.id} rank={i + 1} inv={r.inv} m={r.m} st={ownSt}
              conn={connStateFor(r.inv.id)} onConnect={() => setModal({ id: r.inv.id, name: r.inv.name })} onProfile={() => nav(`/app/investor/${r.inv.id}`)} />
          ) : (
            <StCard key={r.st.id} rank={i + 1} st={r.st} m={r.m}
              conn={connStateFor(r.st.id)} onConnect={() => setModal({ id: r.st.id, name: r.st.name })} onProfile={() => nav(`/app/startup/${r.st.id}`)} />
          ))}
          {rows.length === 0 && (
            <Card className="p-10 text-center">
              <p className="text-[14px] text-white/60">No matches above {minScore}%. Widen the score filter or adjust your {isFounder ? 'ask & stage' : 'mandate'}.</p>
              <Btn variant="outline" size="sm" className="mt-4" onClick={() => { setMinScore(20); setSector('All'); setQ(''); }}><X size={13} /> Reset filters</Btn>
            </Card>
          )}
        </div>
      </AnimatePresence>

      <ConnectModal open={!!modal} onClose={() => setModal(null)} name={modal?.name ?? ''} targetId={modal?.id ?? ''} />
    </div>
  );
}

function InvCard({ rank, inv, m, st, conn, onConnect, onProfile }: { rank: number; inv: Investor; m: Match; st?: Startup; conn: { state: 'none' | 'pending' | 'accepted'; roomTo?: string }; onConnect: () => void; onProfile: () => void }) {
  return (
    <MatchCard rank={rank} name={inv.name} sub={`${inv.title} · ${inv.firm}`} hue={inv.hue} online={inv.active} match={m}
      meta={[{ label: 'cheque', value: `${fmtL(inv.chequeMinL)}–${fmtL(inv.chequeMaxL)}` }, { label: 'deals', value: String(inv.deals) }, { label: 'responds', value: `${inv.response}%` }]}
      profileTo={`/app/investor/${inv.id}`} onConnect={onConnect} connState={conn.state} roomTo={conn.roomTo}
      extra={<div className="flex flex-wrap items-center gap-1.5 border-t border-white/[.05] px-5 py-2.5 text-[11px] text-white/40"><span className="mr-1 uppercase tracking-wider text-white/28">Mandate</span>{inv.sectors.map(s => <Chip key={s} className="!px-2 !py-0 !text-[10.5px]">{s}</Chip>)}<span className="mx-1">·</span>{inv.stages.join(', ')}<span className="mx-1">·</span><button onClick={onProfile} className="a-text hover:brightness-125">view full profile →</button></div>} />
  );
}
function StCard({ rank, st, m, conn, onConnect }: { rank: number; st: Startup; m: Match; conn: { state: 'none' | 'pending' | 'accepted'; roomTo?: string }; onConnect: () => void; onProfile: () => void }) {
  return (
    <MatchCard rank={rank} name={st.name} sub={`${st.tagline}`} hue={st.hue} match={m}
      meta={[{ label: 'ask', value: fmtL(st.askL) }, { label: 'stage', value: st.stage }, { label: 'readiness', value: String(st.readiness) }]}
      profileTo={`/app/startup/${st.id}`} onConnect={onConnect} connState={conn.state} roomTo={conn.roomTo}
      extra={<div className="flex flex-wrap items-center gap-1.5 border-t border-white/[.05] px-5 py-2.5 text-[11px] text-white/40"><span className="mr-1 uppercase tracking-wider text-white/28">Traction</span>{st.traction.slice(0, 2).map(tp => <Chip key={tp.label} tone="jade" className="!px-2 !py-0 !text-[10.5px]">{tp.label}: {tp.value}</Chip>)}<span className="mx-1">·</span>{st.sector} · {st.location}</div>} />
  );
}
