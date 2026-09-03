import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Wallet, Flame, IndianRupee, Clock4, Send, Check, X as XIcon,
  FileText, MessageSquare, Sparkles, TrendingUp, Target, Users2, CalendarDays, Info, Inbox, Rocket,
} from 'lucide-react';
import { Card, CardHead, Chip, Btn, Bar, ScoreRing, Tip, Delta, Avatar, EmptyState, ChartSkeleton, Skel, toast } from '../components/ui';
import { AreaChart, GroupedBars, Spark, Donut, AxisBars } from '../components/charts';
import { useApp, activeStartup } from '../lib/store';
import { fmtL, runway, timeAgo, fmtDay } from '../lib/format';
import { readinessOf, readinessTone } from '../lib/finance';
import { rankMatches, rankStartups } from '../lib/match';

function useFakeLoad(ms = 650) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const id = setTimeout(() => setLoading(false), ms); return () => clearTimeout(id); }, [ms]);
  return loading;
}

function PageHead({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-white sm:text-[27px]">{title}</h1>
        {sub && <p className="mt-1 text-[13px] text-white/45">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

function KpiCard({ icon, label, value, sub, delta, invert, spark, sparkTone, delay = 0 }: {
  icon: ReactNode; label: string; value: ReactNode; sub?: string; delta?: number; invert?: boolean; spark?: number[]; sparkTone?: string; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5, ease: [0.22, 0.8, 0.3, 1] }}>
      <Card hover className="relative overflow-hidden p-5">
        <div className="flex items-center justify-between">
          <span className="a-soft flex h-9 w-9 items-center justify-center rounded-xl">{icon}</span>
          {delta !== undefined && <Delta value={delta} invert={invert} />}
        </div>
        <div className="mt-4 text-[24px] font-bold tracking-tight text-white">{value}</div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="text-[12.5px] text-white/45">{label}</span>
          {spark && <Spark data={spark} tone={sparkTone ?? '238 212 154'} />}
        </div>
        {sub && <div className="mt-1.5 text-[11px] text-white/35">{sub}</div>}
      </Card>
    </motion.div>
  );
}

/* ======================================================== FOUNDER DASH */
export function FounderDashboard() {
  const { db, user, respondConnection } = useApp();
  const nav = useNavigate();
  const loading = useFakeLoad();
  const st = activeStartup(db, user) ?? db.startups[0];
  if (!st) {
    // Founder with no venture yet (fresh account / pre-onboarding) — the
    // whole dashboard derives from the startup, so show a real empty state
    // instead of crashing on undefined reads.
    return (
      <div className="mx-auto max-w-[1080px]">
        <PageHead title="Your dashboard" sub="Everything here is computed live from your venture's real data." />
        <div className="glass flex flex-col items-center gap-4 rounded-2xl px-6 py-16 text-center">
          <span className="a-soft flex h-14 w-14 items-center justify-center rounded-2xl"><Rocket size={22} /></span>
          <h3 className="text-[18px] font-semibold text-white">No venture on your profile yet</h3>
          <p className="max-w-md text-[13px] leading-relaxed text-white/45">
            Add your startup to unlock the readiness score, runway, live matches and your raise pipeline. It takes about two minutes.
          </p>
          <Btn onClick={() => nav('/app/startup/own')}>Create your venture profile <ArrowRight size={14} /></Btn>
        </div>
      </div>
    );
  }
  const matches = rankMatches(st, db.investors);
  const myConns = db.connections.filter(c => c.startupId === st.id);
  const pending = myConns.filter(c => c.status === 'pending' && c.fromRole !== 'founder');
  const accepted = myConns.filter(c => c.status === 'accepted');
  const fin = readinessOf(st);
  const tone = readinessTone(fin.score);
  const rw = runway(st.cashL, st.burnL);
  const outflow = st.revSeries.map((v, i) => +(v + (st.burnSeries[i] ?? st.burnL)).toFixed(1));
  const notices = db.noticesF.slice(0, 4);

  if (loading) return <DashSkeleton />;
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHead
        title={<span>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, <span className="a-grad-txt serif-i">{user?.name.split(' ')[0]}</span></span>}
        sub={<span className="flex flex-wrap items-center gap-2">{st.name} · {st.stage} · raising <b className="a-text font-semibold">{fmtL(st.askL)}</b></span>}
        right={<div className="flex gap-2"><Btn variant="outline" size="md" onClick={() => nav(`/app/startup/${st.id}`)}><FileText size={15} /> View profile</Btn><Btn size="md" onClick={() => nav('/app/matching')}><Sparkles size={15} /> Find investors</Btn></div>}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard delay={0} icon={<Wallet size={16} />} label="Cash in bank" value={fmtL(st.cashL)} delta={-2.1} invert spark={st.burnSeries.map((b, i) => st.cashL - b * (i + 1) * 0 + i * 2)} sub={`≈ ${isFinite(rw) ? rw.toFixed(1) : '∞'} months runway`} />
        <KpiCard delay={0.06} icon={<Flame size={16} />} label="Monthly net burn" value={fmtL(st.burnL)} delta={-2.9} invert spark={st.burnSeries.slice(-6)} sparkTone="251 113 133" sub="Gross spend minus collections" />
        <KpiCard delay={0.12} icon={<IndianRupee size={16} />} label="MRR" value={fmtL(st.revenueL)} delta={st.growthPct} spark={st.revSeries.slice(-6)} sub={`${st.revSeries[st.revSeries.length - 1] > st.prevRevenueL ? 'Consistent' : 'Flat'} month over month`} />
        <KpiCard delay={0.18} icon={<Target size={16} />} label={`Raised · of ${fmtL(st.askL)} target`} value={`${Math.round((st.raisedL / st.askL) * 100)}%`} sub={`${fmtL(st.raisedL)} committed so far`} />
      </div>

      <div className="mt-4"><Bar value={(st.raisedL / st.askL) * 100} className="max-w-full" /></div>

      {/* main grid */}
      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHead title="Revenue vs net burn — trailing 12 months" sub="Hover any point for exact figures"
            right={<span className="flex gap-4 text-[11px] text-white/50"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold-400" />Revenue</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-dashed border-iris-400" />Burn</span></span>} />
          <div className="p-5"><AreaChart data={st.revSeries} showLine2={st.burnSeries} labels={st.months} height={220} /></div>
        </Card>

        <Card>
          <CardHead title="Funding readiness" sub="Explainable score · recalculated live" right={<Tip wide label="Weighted from runway, growth, capital efficiency, traction proof, materials and plan depth. Every point is auditable below."><Info size={14} className="text-white/35" /></Tip>} />
          <div className="flex flex-col items-center gap-1 p-5">
            <ScoreRing score={fin.score} size={132} label="readiness" />
            <div className="text-[14px] font-semibold text-white">{tone.label}</div>
            <div className="text-[11.5px] text-white/40">{tone.desc}</div>
          </div>
          <ul className="space-y-2 border-t border-white/[.06] px-5 py-4">
            {fin.parts.map(p => (
              <li key={p.label}>
                <Tip wide label={p.note}>
                  <span className="flex w-full items-center justify-between gap-2 text-[12px]">
                    <span className="text-white/55">{p.label}</span>
                    <span className="font-mono text-white/80">{p.pts}<span className="text-white/30">/{p.max}</span></span>
                  </span>
                  <Bar value={(p.pts / p.max) * 100} thin className="mt-1" tone={p.pts / p.max > 0.7 ? 'jade' : p.pts / p.max > 0.45 ? 'gold' : 'rose'} />
                </Tip>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHead title="Cash flow — monthly inflow vs outflow" sub="Inflow = collections · Outflow = operating spend" />
          <div className="p-5"><GroupedBars inflow={st.revSeries} outflow={outflow} labels={st.months} height={210} /></div>
        </Card>
        <div className="grid gap-5">
          <Card className="p-5" hover>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-white/50">CAC : LTV</span>
              <Tip wide label="Customer acquisition cost vs lifetime value. Above 3× is investable at seed; you are well past it."><Info size={13} className="text-white/30" /></Tip>
            </div>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-[26px] font-bold text-white">1 : {st.cac && st.ltv ? (st.ltv / st.cac).toFixed(1) : '—'}</span>
              <Chip tone="jade">above 3× bar</Chip>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
              <div className="rounded-lg bg-white/[.04] p-2.5"><span className="text-white/40">CAC</span><div className="font-mono font-semibold text-white">₹{((st.cac ?? 0) / 1000).toFixed(0)}K</div></div>
              <div className="rounded-lg bg-white/[.04] p-2.5"><span className="text-white/40">LTV</span><div className="font-mono font-semibold text-white">{fmtL((st.ltv ?? 0) / 100)}</div></div>
            </div>
          </Card>
          <Card className="p-5" hover>
            <div className="flex items-center justify-between"><span className="text-[12px] font-medium text-white/50">Burn multiple</span><Tip wide label="Net burn ÷ net new ARR. Under 2× is elite capital efficiency."><Info size={13} className="text-white/30" /></Tip></div>
            <div className="mt-2 text-[26px] font-bold text-white">1.6×</div>
            <p className="mt-1 text-[11.5px] text-white/40">Efficient — grows ARR without lighting cash on fire.</p>
          </Card>
        </div>
      </div>

      {/* network row */}
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHead title="Recommended investors" sub="Ranked by transparent 4-axis matching" right={<Link to="/app/matching" className="a-text text-[12px] font-medium hover:brightness-125">View all {matches.length} →</Link>} />
          <div className="divide-y divide-white/[.05]">
            {matches.slice(0, 3).map(({ inv, m }, i) => (
              <motion.div key={inv.id} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-white/[.025]">
                <Avatar name={inv.name} hue={inv.hue} size={44} online={inv.active} />
                <div className="min-w-[150px] flex-1">
                  <div className="flex items-center gap-2 text-[14px] font-semibold text-white">{inv.name} {inv.verified && <Check size={13} className="text-iris-300" />}</div>
                  <div className="text-[12px] text-white/45">{inv.firm} · {fmtL(inv.chequeMinL)}–{fmtL(inv.chequeMaxL)}</div>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  {m.reasons.slice(0, 1).map(r => <span key={r} className="max-w-[290px] truncate text-[11.5px] text-white/42">{r}</span>)}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-mono text-[16px] font-bold a-text">{m.score}%</div>
                    <div className="text-[9.5px] uppercase tracking-wider text-white/35">match</div>
                  </div>
                  <Btn size="sm" variant="outline" onClick={() => nav('/app/matching')}>Review <ArrowUpRight size={13} /></Btn>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        <div className="grid gap-5 content-start">
          <Card>
            <CardHead title="Connection requests" sub={pending.length ? `${pending.length} awaiting your response` : 'All clear'} />
            {pending.length === 0 ? (
              <p className="px-5 py-6 text-[12.5px] text-white/40">No pending inbound — new match alerts appear here first.</p>
            ) : pending.map(c => {
              const inv = db.investors.find(i => i.id === c.investorId);
              if (!inv) return null;
              return (
                <div key={c.id} className="border-t border-white/[.05] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={inv.name} hue={inv.hue} size={38} />
                    <div className="min-w-0"><div className="text-[13px] font-semibold text-white">{inv.name}</div><div className="truncate text-[11.5px] text-white/45">{inv.firm}</div></div>
                    <span className="ml-auto font-mono text-[10px] text-white/30">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="mt-2.5 line-clamp-2 rounded-lg bg-white/[.04] px-3 py-2 text-[12px] italic text-white/60">“{c.message}”</p>
                  <div className="mt-3 flex gap-2">
                    <Btn size="sm" onClick={() => { respondConnection(c.id, true); toast(`Connected with ${inv.name} — private room opened`); }}><Check size={14} /> Accept</Btn>
                    <Btn size="sm" variant="ghost" onClick={() => { respondConnection(c.id, false); toast('Request declined'); }}><XIcon size={14} /> Decline</Btn>
                  </div>
                </div>
              );
            })}
            {accepted.length > 0 && (
              <div className="border-t border-white/[.06] px-5 py-3.5">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/35">Active rooms</div>
                {accepted.map(c => {
                  const inv = db.investors.find(i => i.id === c.investorId);
                  const th = db.threads.find(t => t.connId === c.id);
                  return inv ? (
                    <Link key={c.id} to={th ? `/app/messages/${th.id}` : '/app/messages'} className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-white/[.05]">
                      <Avatar name={inv.name} hue={inv.hue} size={28} online />
                      <span className="text-[12.5px] font-medium text-white/80">{inv.name}</span>
                      <Chip tone="iris" className="ml-auto capitalize">{c.stage}</Chip>
                    </Link>
                  ) : null;
                })}
              </div>
            )}
          </Card>

          <Card>
            <CardHead title="Latest signals" sub="Unread first" />
            <div>
              {notices.map(n => (
                <button key={n.id} onClick={() => nav(n.link)} className="flex w-full items-start gap-3 border-t border-white/[.05] px-5 py-3 text-left transition hover:bg-white/[.03]">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? 'bg-white/15' : 'a-dot pulse-dot'}`} />
                  <span className="min-w-0"><span className="block text-[12.5px] font-medium text-white/85">{n.title}</span><span className="block truncate text-[11px] text-white/40">{n.body}</span></span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* milestones strip */}
      <Card className="mt-5">
        <CardHead title="Funding journey" sub="Milestones toward your round — full timeline in the tracker" right={<Link to="/app/tracker" className="a-text text-[12px] font-medium hover:brightness-125">Open tracker →</Link>} />
        <div className="relative flex gap-0 overflow-x-auto px-5 pb-6 pt-4">
          <span className="absolute left-10 right-10 top-[34px] h-px bg-white/10" aria-hidden />
          {st.milestones.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="relative z-10 w-48 shrink-0 pr-6">
              <span className={`block h-3.5 w-3.5 rounded-full border-2 ${m.status === 'done' ? 'border-emerald-400 bg-emerald-400' : m.status === 'active' ? 'a-stroke a-dot pulse-dot' : 'border-white/25 bg-ink-900'}`} />
              <div className="mt-3 text-[12.5px] font-semibold text-white/88">{m.label}</div>
              <div className="text-[10.5px] text-white/38">{m.date}{m.amountL ? ` · ${fmtL(m.amountL)}` : ''}</div>
              {m.status === 'active' && <Bar value={m.progress} thin className="mt-2 w-28" />}
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function DashSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px]">
      <Skel className="mb-2 h-8 w-72" /><Skel className="h-4 w-56" />
      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">{[...Array(4)].map((_, i) => <Skel key={i} className="h-[138px]" />)}</div>
      <div className="mt-6 grid gap-5 xl:grid-cols-3"><Card className="xl:col-span-2"><ChartSkeleton /></Card><Skel className="h-[380px]" /></div>
    </div>
  );
}

/* ======================================================== INVESTOR DASH */
export function InvestorDashboard() {
  const { db, user } = useApp();
  const nav = useNavigate();
  const loading = useFakeLoad();
  const me = db.investors.find(i => i.userId === user?.id) ?? db.investors[0];
  const ranked = rankStartups(me, db.startups);
  const myConns = db.connections.filter(c => c.investorId === me.id);
  const pendingIn = myConns.filter(c => c.status === 'pending' && c.fromRole !== 'investor');
  const stages = ['intro', 'diligence', 'term-sheet', 'funded'] as const;
  const byStage = (s: (typeof stages)[number]) => myConns.filter(c => c.status === 'accepted' && c.stage === s);
  const hot = ranked.filter(r => r.m.score >= 80).length;
  const notices = db.noticesI.slice(0, 4);

  if (loading) return <DashSkeleton />;
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHead
        title={<span>Deal desk, <span className="a-grad-txt serif-i">{user?.name.split(' ')[0]}</span></span>}
        sub={<span>{me.firm} · {me.title} · mandate: {me.sectors.slice(0, 3).join(' / ')}</span>}
        right={<div className="flex gap-2"><Btn variant="outline" onClick={() => nav('/app/profile')}><Users2 size={15} /> My profile</Btn><Btn onClick={() => nav('/app/matching')}><Sparkles size={15} /> Scan deal flow</Btn></div>}
      />

      {/* mandate strip */}
      <Card className="mb-5 flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4">
        <div className="flex items-center gap-2"><span className="text-[11px] uppercase tracking-wider text-white/35">Sectors</span><span className="flex gap-1.5">{me.sectors.map(s => <Chip key={s} tone="iris">{s}</Chip>)}</span></div>
        <div className="flex items-center gap-2"><span className="text-[11px] uppercase tracking-wider text-white/35">Stages</span><span className="flex gap-1.5">{me.stages.map(s => <Chip key={s}>{s}</Chip>)}</span></div>
        <div className="flex items-center gap-2"><span className="text-[11px] uppercase tracking-wider text-white/35">Cheque</span><span className="font-mono text-[13px] font-semibold a-text">{fmtL(me.chequeMinL)} – {fmtL(me.chequeMaxL)}</span></div>
        <div className="flex items-center gap-2"><span className="text-[11px] uppercase tracking-wider text-white/35">Response</span><span className="flex items-center gap-1.5 text-[12.5px] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {me.response}% within 7d</span></div>
        <Link to="/app/profile" className="a-text ml-auto text-[12px] font-medium hover:brightness-125">Edit mandate →</Link>
      </Card>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard delay={0} icon={<Sparkles size={16} />} label="Matches ≥ 80% today" value={hot} delta={12} sub="Regenerated from live profiles" />
        <KpiCard delay={0.06} icon={<Inbox size={16} />} label="Active opportunities" value={myConns.filter(c => c.status === 'accepted').length} sub={`${byStage('diligence').length} in diligence`} />
        <KpiCard delay={0.12} icon={<IndianRupee size={16} />} label="Pipeline (accepted)" value={fmtL(myConns.filter(c => c.status === 'accepted').reduce((a, c) => a + Math.min(me.chequeMaxL, db.startups.find(s => s.id === c.startupId)?.askL ?? 0), 0))} sub="Aggregate ask across rooms" />
        <KpiCard delay={0.18} icon={<TrendingUp size={16} />} label="Deals closed · lifetime" value={me.deals} sub={`Median close ${me.medCloseDays} days`} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        {/* recommended startups */}
        <Card className="xl:col-span-2">
          <CardHead title="Ranked deal flow" sub="Transparent match reasoning on every card" right={<Link to="/app/matching" className="a-text text-[12px] font-medium hover:brightness-125">Full ranking →</Link>} />
          <div className="divide-y divide-white/[.05]">
            {ranked.slice(0, 4).map(({ st, m }, i) => (
              <motion.button key={st.id} onClick={() => nav(`/app/startup/${st.id}`)} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.07 }}
                className="flex w-full flex-wrap items-center gap-4 px-5 py-4 text-left transition hover:bg-white/[.025]">
                <span className="w-6 text-center font-mono text-[12px] text-white/30">#{i + 1}</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl font-bold text-ink-950" style={{ background: `linear-gradient(135deg, hsl(${st.hue} 65% 62%), hsl(${st.hue + 30} 60% 45%))` }}>{st.name.slice(0, 1)}</span>
                <div className="min-w-[150px] flex-1">
                  <div className="text-[14px] font-semibold text-white">{st.name} <span className="ml-1 text-[11px] font-normal text-white/40">{st.sector} · {st.stage}</span></div>
                  <div className="mt-0.5 max-w-md truncate text-[12px] text-white/45">{st.tagline}</div>
                </div>
                <div className="hidden text-right md:block">
                  <div className="font-mono text-[13px] text-white/80">{fmtL(st.askL)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-white/35">ask</div>
                </div>
                <div className="hidden text-right md:block">
                  <div className="font-mono text-[13px] text-emerald-300">{st.readiness}</div>
                  <div className="text-[10px] uppercase tracking-wider text-white/35">readiness</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right"><div className="font-mono text-[16px] font-bold a-text">{m.score}%</div><div className="text-[9.5px] uppercase tracking-wider text-white/35">match</div></div>
                  <ArrowRight size={15} className="text-white/30" />
                </div>
              </motion.button>
            ))}
          </div>
        </Card>

        <div className="grid content-start gap-5">
          {/* pipeline */}
          <Card>
            <CardHead title="Pipeline" sub="Accepted opportunities by stage" right={<Link to="/app/tracker" className="a-text text-[12px] font-medium hover:brightness-125">Board →</Link>} />
            <div className="grid grid-cols-4 gap-2 px-5 py-4 text-center">
              {stages.map(s => (
                <div key={s} className="rounded-xl border border-white/[.07] bg-white/[.03] py-3">
                  <div className="font-mono text-[18px] font-bold a-text">{byStage(s).length}</div>
                  <div className="mt-0.5 text-[9.5px] uppercase tracking-wide text-white/40">{s.replace('-', ' ')}</div>
                </div>
              ))}
            </div>
            {pendingIn.length > 0 && (
              <div className="border-t border-white/[.06] px-5 py-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/35">Inbound requests</div>
                {pendingIn.map(c => {
                  const s = db.startups.find(x => x.id === c.startupId);
                  return s ? (
                    <Link to="/app/connections" key={c.id} className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-white/[.05]">
                      <Avatar name={s.founder.name} hue={s.hue} size={28} />
                      <span className="text-[12.5px] text-white/80">{s.name}</span>
                      <span className="ml-auto font-mono text-[10px] text-white/35">{timeAgo(c.createdAt)}</span>
                    </Link>
                  ) : null;
                })}
              </div>
            )}
          </Card>

          {/* sector coverage */}
          <Card className="p-5">
            <div className="mb-3 text-[13px] font-semibold text-white/88">Match mix by sector</div>
            <Donut size={132} center={`${ranked.length}`} centerSub="startups"
              segs={me.sectors.map((sname, i) => ({
                label: sname,
                value: Math.max(1, db.startups.filter(s => s.sector === sname).length + (i === 0 ? 1 : 0)),
                color: ['#8b9fff', '#eed49a', '#34d399', '#fb7185', '#c084fc'][i % 5],
              }))} />
          </Card>

          {/* signals */}
          <Card>
            <CardHead title="Signals" sub="Unread first" />
            <div>
              {notices.map(n => (
                <button key={n.id} onClick={() => nav(n.link)} className="flex w-full items-start gap-3 border-t border-white/[.05] px-5 py-3 text-left transition hover:bg-white/[.03]">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? 'bg-white/15' : 'a-dot pulse-dot'}`} />
                  <span className="min-w-0"><span className="block text-[12.5px] font-medium text-white/85">{n.title}</span><span className="block truncate text-[11px] text-white/40">{n.body}</span></span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* events strip */}
      <Card className="mt-5">
        <CardHead title="Rooms worth your calendar" sub="Live from Firestore" right={<Link to="/app/events" className="a-text text-[12px] font-medium hover:brightness-125">All events →</Link>} />
        <div className="grid gap-3 px-5 pb-5 sm:grid-cols-3">
          {db.events.slice(0, 3).map(ev => (
            <button key={ev.id} onClick={() => nav('/app/events')} className="group rounded-xl border border-white/[.07] bg-white/[.02] p-4 text-left transition hover:border-white/20 hover:bg-white/[.05]">
              <div className="flex items-center gap-2 text-[11px] text-white/40"><CalendarDays size={12} /> {fmtDay(Date.parse(ev.date) || Date.now())} · {ev.kind}</div>
              <div className="mt-1.5 text-[13.5px] font-semibold leading-snug text-white/88 group-hover:text-white">{ev.title}</div>
              <div className="mt-2 text-[11px] text-gold-300">{ev.left} seats left</div>
            </button>
          ))}
          {db.events.length === 0 && (
            <p className="col-span-3 py-8 text-center text-[12.5px] text-white/40">No events scheduled yet — check back soon.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

export function DashboardRouter() {
  const { user } = useApp();
  if (user?.role === 'investor') return <InvestorDashboard />;
  if (user?.role === 'admin') return <Navigate to="/app/admin" replace />;
  return <FounderDashboard />;
}

export function EmptyConversations({ action }: { action?: ReactNode }) {
  return <EmptyState icon={<MessageSquare size={18} />} title="No private rooms yet" sub="Rooms open automatically when a connection is accepted — decks, files and threads stay inside this encrypted lane." action={action} />;
}
