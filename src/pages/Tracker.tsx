import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitBranch, Target, Plus, CalendarDays, MessageSquare, TrendingUp, Rocket, ChevronRight, Landmark } from 'lucide-react';
import { Card, CardHead, Chip, Btn, Bar, Avatar, toast } from '../components/ui';
import { Donut, AreaChart } from '../components/charts';
import { useApp, activeStartup } from '../lib/store';
import { fmtL, runway } from '../lib/format';
import type { OppStage } from '../lib/types';

function FounderTracker() {
  const { db, user, bumpMilestone } = useApp();
  const st = activeStartup(db, user) ?? db.startups[0];
  const raised = st.raisedL;
  const pctRaised = Math.min(100, (raised / st.askL) * 100);
  const proj = [...st.revSeries, 22.9, 25.1].map((v, i) => (i >= st.revSeries.length ? +(v * 1.0) : v));
  const burnProj = [...st.burnSeries, 11.5, 13.2];
  const rw = runway(st.cashL, st.burnL);

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 className="flex items-center gap-2.5 text-[24px] font-bold tracking-tight text-white sm:text-[27px]">
          <span className="a-soft flex h-10 w-10 items-center justify-center rounded-xl"><GitBranch size={18} /></span>
          Funding Tracker
        </h1>
        <p className="mt-1.5 text-[13px] text-white/45">{st.name} · {st.stage} round · target {fmtL(st.askL)}</p>
      </div>

      {/* round summary */}
      <Card className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-0 opacity-[.5]" style={{ background: 'radial-gradient(600px 200px at 80% -40px, rgb(var(--acc)/.14), transparent)' }} />
        <div className="relative flex flex-wrap items-center gap-x-10 gap-y-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/38">Committed so far</div>
            <div className="mt-1 text-[34px] font-bold tracking-tight text-white">{fmtL(raised)} <span className="text-[15px] font-medium text-white/38">of {fmtL(st.askL)}</span></div>
          </div>
          <div className="min-w-[240px] flex-1">
            <Bar value={pctRaised} />
            <div className="mt-2 flex justify-between text-[11px] text-white/40">
              <span>{pctRaised.toFixed(0)}% of target</span>
              <span className="flex items-center gap-1.5"><TrendingUp size={12} className="text-emerald-400" /> 2 term-sheet conversations active</span>
            </div>
          </div>
          <div className="flex gap-7">
            <div className="text-right"><div className="font-mono text-[18px] font-bold a-text">{isFinite(rw) ? rw.toFixed(1) : '∞'} mo</div><div className="text-[10px] uppercase tracking-wider text-white/35">runway now</div></div>
            <div className="text-right"><div className="font-mono text-[18px] font-bold text-white/85">+18 mo</div><div className="text-[10px] uppercase tracking-wider text-white/35">post-close</div></div>
            <div className="text-right"><div className="font-mono text-[18px] font-bold text-emerald-300">Apr ’25</div><div className="text-[10px] uppercase tracking-wider text-white/35">target close</div></div>
          </div>
          <Link to="/app/matching" className="ml-auto"><Btn size="sm"><Target size={14} /> Find the remaining {100 - Math.round(pctRaised)}%</Btn></Link>
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* timeline */}
        <Card className="lg:col-span-2">
          <CardHead title="Milestone timeline" sub={user ? 'Click + to log progress — investors watching see it live' : ''} />
          <div className="p-6">
            <div className="relative ml-2 border-l border-white/10 pl-7">
              {st.milestones.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.09 }} className="relative pb-8 last:pb-1">
                  <span className={`absolute -left-[33px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 ${m.status === 'done' ? 'border-emerald-400 bg-emerald-400' : m.status === 'active' ? 'a-stroke bg-ink-900' : 'border-white/25 bg-ink-900'}`}>
                    {m.status === 'active' && <span className="a-dot h-1.5 w-1.5 rounded-full pulse-dot" />}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14.5px] font-semibold text-white/92">{m.label}</span>
                    {m.amountL && <Chip tone="gold">{fmtL(m.amountL)}</Chip>}
                    <Chip tone={m.status === 'done' ? 'jade' : m.status === 'active' ? 'acc' : 'neutral'} className="capitalize">{m.status}</Chip>
                    <span className="ml-auto flex items-center gap-1 font-mono text-[10.5px] text-white/32"><CalendarDays size={10} /> {m.date}</span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-white/48">{m.detail}</p>
                  {m.status !== 'done' && (
                    <div className="mt-2.5 flex max-w-sm items-center gap-3">
                      <Bar value={m.progress} thin className="flex-1" />
                      <span className="font-mono text-[10.5px] text-white/45">{m.progress}%</span>
                      <button onClick={() => { bumpMilestone(st.id, m.id); toast(`Progress logged on “${m.label}”`); }}
                        className="a-soft flex h-6 w-6 items-center justify-center rounded-md transition hover:scale-110" aria-label={`Log progress on ${m.label}`}><Plus size={12} /></button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          {/* projection */}
          <Card>
            <CardHead title="Post-close projection" sub="Dashed = with this round wired" />
            <div className="p-5 pt-2">
              <AreaChart data={proj} labels={[...st.months, 'Mar*', 'Apr*']} showLine2={burnProj} height={170} />
            </div>
          </Card>
          {/* capital plan */}
          <Card className="p-5">
            <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/40">Use of funds</h3>
            <Donut size={128} center={fmtL(st.askL)} centerSub="deployment"
              segs={[
                { label: 'Product & eng', value: 40, color: '#eed49a' },
                { label: 'GTM & sales', value: 35, color: '#8b9fff' },
                { label: 'Key hires', value: 15, color: '#34d399' },
                { label: 'Ops buffer', value: 10, color: '#fb7185' },
              ]} />
          </Card>
          {/* connected rooms */}
          <Card>
            <CardHead title="Rooms tracking this round" />
            <div className="space-y-1 p-3">
              {db.connections.filter(c => c.startupId === st.id && c.status === 'accepted').map(c => {
                const inv = db.investors.find(i => i.id === c.investorId);
                const th = db.threads.find(t => t.connId === c.id);
                return inv ? (
                  <Link key={c.id} to={th ? `/app/messages/${th.id}` : '/app/messages'} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/[.05]">
                    <Avatar name={inv.name} hue={inv.hue} size={34} online />
                    <div className="min-w-0 flex-1"><div className="text-[13px] font-semibold text-white/88">{inv.name}</div><div className="truncate text-[11px] text-white/40">{inv.firm}</div></div>
                    <Chip tone="iris" className="capitalize">{c.stage.replace('-', ' ')}</Chip>
                  </Link>
                ) : null;
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InvestorPipeline() {
  const { db, user, setConnStage } = useApp();
  const me = db.investors.find(i => i.userId === user?.id) ?? db.investors[0];
  const mine = db.connections.filter(c => c.investorId === me.id && c.status === 'accepted');
  const pending = db.connections.filter(c => c.investorId === me.id && c.status === 'pending');
  const [expanded, setExpanded] = useState<string | null>(null);
  const cols: { id: OppStage; label: string; hint: string }[] = [
    { id: 'intro', label: 'Intro', hint: 'First conversations' },
    { id: 'diligence', label: 'Diligence', hint: 'Data room open' },
    { id: 'term-sheet', label: 'Term sheet', hint: 'Economics live' },
    { id: 'funded', label: 'Funded', hint: 'Wired & closed' },
  ];
  const pipeL = mine.reduce((a, c) => a + Math.min(me.chequeMaxL, db.startups.find(s => s.id === c.startupId)?.askL ?? 0), 0);

  return (
    <div className="mx-auto max-w-[1240px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-[24px] font-bold tracking-tight text-white sm:text-[27px]">
            <span className="a-soft flex h-10 w-10 items-center justify-center rounded-xl"><Landmark size={18} /></span>
            Investment Pipeline
          </h1>
          <p className="mt-1.5 text-[13px] text-white/45">{me.firm} · {mine.length} live opportunities · {fmtL(pipeL)} aggregate ask</p>
        </div>
        <div className="flex gap-6">
          <div className="text-right"><div className="font-mono text-[20px] font-bold a-text">{mine.filter(c => c.stage === 'term-sheet').length}</div><div className="text-[10px] uppercase tracking-wider text-white/35">term sheets live</div></div>
          <div className="text-right"><div className="font-mono text-[20px] font-bold text-white/85">{pending.length}</div><div className="text-[10px] uppercase tracking-wider text-white/35">awaiting reply</div></div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {cols.map((col, ci) => {
          const cards = mine.filter(c => c.stage === col.id);
          return (
            <motion.div key={col.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.08 }} className="flex flex-col">
              <div className="mb-3 flex items-center justify-between rounded-xl border border-white/[.07] bg-white/[.03] px-3.5 py-2.5">
                <div><span className="text-[13px] font-semibold text-white/90">{col.label}</span><span className="ml-2 font-mono text-[11px] a-text">{cards.length}</span></div>
                <span className="text-[10px] text-white/30">{col.hint}</span>
              </div>
              <div className="flex-1 space-y-3">
                {cards.map((c, i) => {
                  const st = db.startups.find(s => s.id === c.startupId);
                  const th = db.threads.find(t => t.connId === c.id);
                  if (!st) return null;
                  const open = expanded === c.id;
                  return (
                    <motion.div key={c.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.07, layout: { duration: 0.3 } }}>
                      <Card hover className="p-4">
                        <button className="flex w-full items-center gap-3 text-left" onClick={() => setExpanded(open ? null : c.id)} aria-expanded={open}>
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-ink-950" style={{ background: `linear-gradient(135deg, hsl(${st.hue} 65% 62%), hsl(${st.hue + 30} 60% 45%))` }}>{st.name[0]}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-white">{st.name}</span>
                            <span className="block truncate text-[11px] text-white/42">{st.sector} · ask {fmtL(st.askL)}</span>
                          </span>
                          <ChevronRight size={15} className={`text-white/30 transition-transform ${open ? 'rotate-90' : ''}`} />
                        </button>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-mono text-[11px] text-white/45"><Rocket size={11} /> readiness <b className={st.readiness >= 75 ? 'text-emerald-300' : 'text-gold-300'}>{st.readiness}</b></span>
                          <Bar value={st.readiness} thin className="w-20" tone={st.readiness >= 75 ? 'jade' : 'gold'} />
                        </div>
                        {open && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-2 border-t border-white/[.07] pt-3">
                            <div className="grid grid-cols-2 gap-1">
                              {cols.filter(x => x.id !== col.id).map(x => (
                                <Btn key={x.id} size="sm" variant="dark" onClick={() => { setConnStage(c.id, x.id); toast(`${st.name} → ${x.label}`); }}>{x.label}</Btn>
                              ))}
                            </div>
                            {th && <Link to={`/app/messages/${th.id}`}><Btn size="sm" variant="outline" className="w-full"><MessageSquare size={12} /> Open room</Btn></Link>}
                            <Link to={`/app/startup/${st.id}`}><Btn size="sm" variant="ghost" className="w-full">Full profile →</Btn></Link>
                          </motion.div>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
                {cards.length === 0 && <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-[11.5px] text-white/30">Drop deals here as they progress</div>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function Tracker() {
  const { user } = useApp();
  return user?.role === 'investor' ? <InvestorPipeline /> : <FounderTracker />;
}
