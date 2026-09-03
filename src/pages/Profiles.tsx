import { useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Users, CalendarDays, BadgeCheck, FileText, Eye, Share2, Lock, LockOpen, Pencil, Rocket,
  GraduationCap, BriefcaseBusiness, TrendingUp, Info, UploadCloud, Send, Landmark, Mail, Phone, Globe2, CheckCircle2, ArrowRight, Flag as FlagIcon,
} from 'lucide-react';
import { Card, CardHead, Chip, Btn, ScoreRing, Tip, Bar, Tabs, Modal, Field, Input, Textarea, toast, EmptyState } from '../components/ui';
import { AreaChart, GroupedBars, AxisBars, Spark } from '../components/charts';
import { useApp, activeStartup } from '../lib/store';
import { fmtL, runway, timeAgo, inr } from '../lib/format';
import { readinessOf, readinessTone } from '../lib/finance';
import { scoreMatch } from '../lib/match';
import { ConnectModal } from './Matching';

/* ====================================================== STARTUP PROFILE */
export function StartupProfile() {
  const { id } = useParams();
  const { db, user, updateStartup, toggleDeckShare, attachDeck, deckBlobUrl, pushNotice, createStartup, setFocusStartup } = useApp();
  const own = activeStartup(db, user);
  const st = (id === 'own' ? own : db.startups.find(s => s.id === id)) ?? own;
  const [tab, setTab] = useState('overview');
  const [connectOpen, setConnectOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deckBusy, setDeckBusy] = useState(false);
  const [uploadingDeck, setUploadingDeck] = useState(false);
  const [editF, setEditF] = useState({ tagline: st?.tagline ?? '', stage: st?.stage ?? '', askL: st?.askL ?? 0 });
  const [newVenture, setNewVenture] = useState(false);
  const [nv, setNv] = useState({ name: '', sector: 'SaaS', stage: 'Idea', askL: 100 });
  const isOwner = !!st && st.ownerId === user?.id;
  const ownedList = db.startups.filter(s => s.ownerId === user?.id);
  const fin = useMemo(() => (st ? readinessOf(st) : null), [st]);
  const tone = fin ? readinessTone(fin.score) : null;
  const conn = db.connections.find(c => c.startupId === st?.id && c.investorId === db.investors.find(i => i.userId === user?.id)?.id);

  // Founder visiting their own venture page with NO startup yet: show the
  // creation form instead of the misleading “not found” empty state.
  if (id === 'own' && user?.role === 'founder' && !st) {
    return (
      <div className="mx-auto max-w-[760px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-white sm:text-[25px]">Your venture profile</h1>
            <p className="mt-1 text-[12.5px] text-white/45">This is what investors see when they evaluate you.</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="flex items-center gap-2.5 text-[16px] font-semibold text-white"><Rocket size={17} className="a-text" /> Set up your first venture</h3>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/45">Add your startup and it becomes your live public profile — deck, financials, milestones and matching all hang off this. You can keep refining after creation.</p>
          <div className="mt-5 space-y-4">
            <Field label="Venture name" required><Input value={nv.name} onChange={e => setNv(f => ({ ...f, name: e.target.value }))} placeholder="Acme Robotics" autoFocus /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Sector"><Input value={nv.sector} onChange={e => setNv(f => ({ ...f, sector: e.target.value }))} /></Field>
              <Field label="Stage"><Input value={nv.stage} onChange={e => setNv(f => ({ ...f, stage: e.target.value }))} /></Field>
              <Field label="Ask (₹ lakh)"><Input type="number" value={nv.askL} onChange={e => setNv(f => ({ ...f, askL: +e.target.value }))} /></Field>
            </div>
            <div className="flex justify-end">
              <Btn disabled={!nv.name.trim()} onClick={async () => {
                const nid = await createStartup({ name: nv.name.trim(), sector: nv.sector || 'SaaS', stage: nv.stage || 'Idea', askL: nv.askL || 100 });
                if (nid) toast(`“${nv.name.trim()}” created — your dashboard is live`);
              }}>Create venture <ArrowRight size={14} /></Btn>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!st || !fin || !tone) return <EmptyState icon={<Info size={18} />} title="Startup not found" sub="This profile may have been removed." action={<Link to="/app/dashboard"><Btn size="sm">Dashboard</Btn></Link>} />;

  const rw = runway(st.cashL, st.burnL);
  const outflow = st.revSeries.map((v, i) => +(v + (st.burnSeries[i] ?? st.burnL)).toFixed(1));

  return (
    <div className="mx-auto max-w-[1150px]">
      {/* hero */}
      <div className="glass relative overflow-hidden rounded-2xl">
        <div className="h-28 sm:h-36" style={{ background: `linear-gradient(120deg, hsl(${st.hue} 55% 26%), hsl(${st.hue + 50} 50% 14%) 60%, hsl(${st.hue + 90} 45% 18%))` }}>
          <div className="h-full w-full opacity-40" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.14) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        </div>
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-9 flex flex-wrap items-end gap-4">
            <span className="flex h-[76px] w-[76px] items-center justify-center rounded-2xl border-4 border-ink-950 text-[26px] font-bold text-ink-950 shadow-2xl" style={{ background: `linear-gradient(135deg, hsl(${st.hue} 68% 64%), hsl(${st.hue + 32} 62% 42%))` }}>{st.name.slice(0, 1)}</span>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[24px] font-bold tracking-tight text-white">{st.name}</h1>
                <Chip tone="gold">{st.stage}</Chip><Chip>{st.sector}</Chip>
                {st.highlights.slice(0, 1).map(h => <Chip key={h} tone="jade">{h}</Chip>)}
              </div>
              <p className="mt-1 text-[13.5px] text-white/55">{st.tagline}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-4 text-[11.5px] text-white/40">
                <span className="flex items-center gap-1"><MapPin size={11} /> {st.location}</span>
                <span className="flex items-center gap-1"><Users size={11} /> {st.team} people</span>
                <span className="flex items-center gap-1"><CalendarDays size={11} /> est. {st.founded}</span>
              </div>
            </div>
            <div className="flex items-center gap-5 pb-1">
              <div className="text-center">
                <ScoreRing score={fin.score} size={72} strokeW={6} />
                <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35">{tone.label}</div>
              </div>
              <div className="flex flex-col gap-2">
                {!isOwner && user?.role === 'investor' && (
                  <Btn size="sm" onClick={() => { if (conn) { toast(conn.status === 'accepted' ? 'Already connected — open the room' : 'Request already pending', 'warn'); return; } setConnectOpen(true); }}><Send size={13} /> Request connection</Btn>
                )}
                {!isOwner && user?.role === 'founder' && null}
                {isOwner && <Btn size="sm" variant="outline" onClick={() => setEditOpen(true)}><Pencil size={13} /> Edit profile</Btn>}
                {isOwner && (
                  <div className="flex items-center gap-1.5 rounded-xl border border-white/[.09] bg-white/[.03] px-2 py-1.5">
                    <Rocket size={12} className="a-text shrink-0" />
                    <select value={st.id} onChange={e => { if (e.target.value === '__new') { setNewVenture(true); } else { setFocusStartup(e.target.value); toast(`Switched to ${ownedList.find(o => o.id === e.target.value)?.name}`); } }} aria-label="Switch venture"
                      className="cursor-pointer bg-transparent text-[12px] font-medium text-white/75 outline-none [&>option]:bg-ink-850">
                      {ownedList.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      <option value="__new">＋ New venture…</option>
                    </select>
                  </div>
                )}
                <Btn size="sm" variant="dark" onClick={() => { navigator.clipboard?.writeText(location.href); toast('Secure profile link copied — expires in 7 days'); }}><Share2 size={13} /> Share</Btn>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ask strip */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: 'Raising', v: fmtL(st.askL), s: `for ~${st.equityPct}% equity` },
          { l: 'Committed', v: fmtL(st.raisedL), s: `${Math.round((st.raisedL / st.askL) * 100)}% of target` },
          { l: 'MRR', v: fmtL(st.revenueL), s: `+${st.growthPct}% MoM` },
          { l: 'Runway', v: isFinite(rw) ? `${rw.toFixed(1)} mo` : '∞', s: `at ${fmtL(st.burnL)}/mo burn` },
        ].map((k, i) => (
          <motion.div key={k.l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card hover className="p-4.5">
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/35">{k.l}</div>
              <div className="mt-1 text-[21px] font-bold text-white">{k.v}</div>
              <div className="text-[11px] text-white/42">{k.s}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* tabs */}
      <div className="mt-6 mb-5">
        <Tabs active={tab} onChange={setTab} tabs={[
          { id: 'overview', label: 'Overview' }, { id: 'financials', label: 'Financials' },
          { id: 'traction', label: 'Traction' }, { id: 'deck', label: 'Pitch deck' }, { id: 'roadmap', label: 'Roadmap' },
        ]} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
          {tab === 'overview' && (
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-2">
                <Card className="p-6"><p className="serif-i text-[19px] leading-relaxed text-white/85">“{st.pitch}”</p></Card>
                <div className="grid gap-5 sm:grid-cols-2">
                  {[['Problem', st.problem], ['Solution', st.solution], ['Market', st.market], ['Business model', st.model]].map(([h, body]) => (
                    <Card key={h} hover className="p-5">
                      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] a-text">{h}</h3>
                      <p className="text-[13px] leading-relaxed text-white/62">{body}</p>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="space-y-5">
                <Card>
                  <CardHead title="Founder" sub={st.founder.title} />
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full text-[15px] font-bold text-ink-950" style={{ background: `hsl(${st.hue} 62% 60%)` }}>{st.founder.name.split(' ').map(x => x[0]).join('')}</span>
                      <div><div className="text-[14.5px] font-semibold text-white">{st.founder.name}</div><div className="text-[11.5px] text-white/45">{st.founder.title}</div></div>
                    </div>
                    <p className="mt-3.5 text-[12.5px] leading-relaxed text-white/58">{st.founder.bio || 'Operator-turned-founder. Full background verified by VentureSetu.'}</p>
                    <div className="mt-4 space-y-2">
                      {st.founder.qualifications.map(q => <div key={q} className="flex items-start gap-2 text-[12.5px] text-white/65"><GraduationCap size={13} className="mt-0.5 shrink-0 a-text" />{q}</div>)}
                      {st.founder.experience.map(q => <div key={q} className="flex items-start gap-2 text-[12.5px] text-white/65"><BriefcaseBusiness size={13} className="mt-0.5 shrink-0 text-white/35" />{q}</div>)}
                    </div>
                  </div>
                </Card>
                <Card className="p-5">
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Signals</h3>
                  <div className="flex flex-wrap gap-1.5">{[...st.highlights, ...st.tags].map(h => <Chip key={h} tone="neutral">{h}</Chip>)}</div>
                </Card>
              </div>
            </div>
          )}

          {tab === 'financials' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { l: 'Cash in bank', v: fmtL(st.cashL), note: 'Across accounts, verified monthly' },
                  { l: 'Net monthly burn', v: fmtL(st.burnL), note: 'Spend minus collections' },
                  { l: 'Monthly revenue', v: fmtL(st.revenueL), note: 'Last full month, audited' },
                  { l: 'Growth (MoM)', v: `+${st.growthPct}%`, note: 'Trailing-3-month average' },
                ].map(k => (
                  <Card key={k.l} hover className="p-5">
                    <div className="flex items-center justify-between text-[10.5px] uppercase tracking-[0.14em] text-white/35">{k.l}<Tip wide label={k.note}><Info size={12} className="text-white/30" /></Tip></div>
                    <div className="mt-1.5 text-[22px] font-bold text-white">{k.v}</div>
                  </Card>
                ))}
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                <Card><CardHead title="Revenue trend — trailing 12m" sub="Collections in ₹ lakh / month" right={<Spark data={st.revSeries.slice(-8)} />}/><div className="p-5 pt-2"><AreaChart data={st.revSeries} labels={st.months} height={200} /></div></Card>
                <Card><CardHead title="Inflow vs outflow" sub="Monthly collections vs operating spend" /><div className="p-5 pt-2"><GroupedBars inflow={st.revSeries} outflow={outflow} labels={st.months} height={200} /></div></Card>
              </div>
              <div className="grid gap-5 lg:grid-cols-3">
                <Card className="p-5">
                  <div className="flex items-center justify-between text-[10.5px] uppercase tracking-[0.14em] text-white/35">Unit economics <Tip wide label="CAC and LTV in ₹. Anything above 1:3 at seed is investable."><Info size={12} className="text-white/30" /></Tip></div>
                  <div className="mt-2.5 text-[24px] font-bold text-white">1 : {st.cac && st.ltv ? (st.ltv / st.cac).toFixed(1) : 'n/a'}</div>
                  <div className="mt-3 space-y-1.5 text-[12px] text-white/55">
                    <div className="flex justify-between"><span>CAC</span><span className="font-mono text-white/85">{st.cac ? inr(st.cac) : '—'}</span></div>
                    <div className="flex justify-between"><span>LTV (36-mo)</span><span className="font-mono text-white/85">{st.ltv ? inr(st.ltv) : '—'}</span></div>
                    <div className="flex justify-between"><span>Gross margin</span><span className="font-mono text-emerald-300">92%</span></div>
                  </div>
                </Card>
                <Card className="lg:col-span-2">
                  <CardHead title="Readiness breakdown" sub="Every point, accounted for" />
                  <div className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
                    {fin.parts.map(p => (
                      <div key={p.label}>
                        <div className="flex justify-between text-[12px]"><span className="text-white/60">{p.label}</span><span className="font-mono text-white/85">{p.pts}/{p.max}</span></div>
                        <Bar value={(p.pts / p.max) * 100} thin className="mt-1.5" tone={p.pts / p.max > 0.7 ? 'jade' : 'gold'} />
                        <p className="mt-1 text-[10.5px] text-white/35">{p.note}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {tab === 'traction' && (
            <div className="grid gap-5 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHead title="Verified traction" sub="Signals confirmed against bank / gateway data" />
                <div className="grid gap-3.5 p-5 sm:grid-cols-2">
                  {st.traction.map((tp, i) => (
                    <motion.div key={tp.label} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                      className="rounded-xl border border-white/[.07] bg-white/[.03] p-4 transition hover:border-white/20">
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-white/38">{tp.label}<BadgeCheck size={13} className="text-emerald-400" /></div>
                      <div className="mt-1.5 text-[22px] font-bold text-white">{tp.value}</div>
                      {tp.delta && <div className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-300"><TrendingUp size={11} />{tp.delta}</div>}
                    </motion.div>
                  ))}
                </div>
              </Card>
              <Card className="p-5">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Where we win</h3>
                <ul className="mt-3 space-y-2.5">
                  {st.highlights.map(h => <li key={h} className="flex items-start gap-2 text-[13px] text-white/70"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-gold-400" />{h}</li>)}
                </ul>
                <div className="mt-5 border-t border-white/[.06] pt-4">
                  <div className="mb-2 text-[11px] uppercase tracking-wider text-white/35">Momentum (rev, 12w)</div>
                  <Spark data={st.revSeries.slice(-12)} w={230} h={46} />
                </div>
              </Card>
            </div>
          )}

          {tab === 'deck' && (
            <div className="grid gap-5 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHead title="Pitch deck" sub={st.deck ? `Updated ${timeAgo(st.deck.updatedAt)}` : 'No deck yet'} right={isOwner && (
                  <label className="a-soft inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition hover:brightness-125">
                    {uploadingDeck ? <><UploadCloud size={13} /> Uploading…</> : <><UploadCloud size={13} /> {st.deck ? 'Replace' : 'Upload'} PDF</>}
                    <input type="file" accept="application/pdf" className="hidden" disabled={uploadingDeck} onChange={async e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setUploadingDeck(true);
                        const r = await attachDeck(st.id, f);
                        setUploadingDeck(false);
                        if ('err' in r) toast(r.err, 'warn');
                        else toast('Deck uploaded — sharing stays revocable');
                      }
                      e.target.value = '';
                    }} />
                  </label>
                )} />
                {st.deck ? (
                  <div className="p-5">
                    <button onClick={async () => {
                      if (!isOwner && !st.deck?.sharedWith.includes(db.investors.find(i => i.userId === user?.id)?.id ?? '')) {
                        toast('The founder hasn’t granted you deck access yet', 'warn'); return;
                      }
                      setDeckBusy(true);
                      const url = await deckBlobUrl(st.deck!);
                      setDeckBusy(false);
                      if (!url) { toast('Deck access denied or unavailable', 'warn'); return; }
                      setPreviewUrl(url); setDeckOpen(true);
                    }} className="group relative block w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-ink-800 to-ink-900 p-8 text-left transition hover:border-white/25">
                      <div className="absolute inset-0 opacity-[.07]" style={{ backgroundImage: `repeating-linear-gradient(-35deg, transparent 0 26px, rgba(255,255,255,.9) 26px 27px)` }} />
                      <div className="relative flex items-center gap-5">
                        <span className="flex h-16 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400/30 to-rose-600/20 text-rose-200"><FileText size={22} /></span>
                        <div>
                          <div className="text-[16px] font-semibold text-white">{st.deck.name}</div>
                          <div className="mt-1 text-[12px] text-white/45">{(st.deck.sizeKB / 1024).toFixed(1)} MB · PDF · rules-gated access</div>
                          <div className="mt-2 flex items-center gap-1.5 text-[12px] font-medium a-text">{deckBusy ? 'Loading secure preview…' : <><Eye size={13} /> Open secure preview</>}</div>
                        </div>
                      </div>
                      <span className="pointer-events-none absolute bottom-3 right-4 font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">Storage-rule protected</span>
                    </button>
                    {!isOwner && (
                      <p className="mt-4 flex items-center gap-2 rounded-lg border border-white/[.08] bg-white/[.03] px-3.5 py-2.5 text-[12px] text-white/50">
                        {(st.deck.sharedWith.includes(db.investors.find(i => i.userId === user?.id)?.id ?? ''))
                          ? <><LockOpen size={13} className="text-emerald-400" /> The founder has granted you access.</>
                          : <><Lock size={13} className="text-gold-400" /> Preview unlocks after the founder grants access on your connection.</>}
                      </p>
                    )}
                  </div>
                ) : <EmptyState icon={<FileText size={18} />} title="No deck uploaded" sub="Upload a PDF to boost readiness and start controlled sharing." />}
              </Card>
              <Card>
                <CardHead title="Controlled sharing" sub="Per-connection, revocable" />
                <div className="space-y-2.5 p-5">
                  {isOwner ? (
                    db.investors.filter(inv => db.connections.some(c => c.startupId === st.id && c.investorId === inv.id && c.status === 'accepted')).map(inv => {
                      const granted = st.deck?.sharedWith.includes(inv.id);
                      return (
                        <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.03] px-3.5 py-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-ink-950" style={{ background: `hsl(${inv.hue} 58% 62%)` }}>{inv.name.split(' ').map(x => x[0]).join('')}</span>
                          <div className="min-w-0 flex-1"><div className="truncate text-[12.5px] font-semibold text-white/85">{inv.name}</div><div className="truncate text-[10.5px] text-white/38">{inv.firm}</div></div>
                          <button onClick={() => { toggleDeckShare(st.id, inv.id); pushNotice({ type: 'system', title: granted ? 'Deck access revoked' : 'Deck access granted', body: `${inv.firm} ${granted ? 'lost' : 'received'} watermarked preview rights.`, link: `/app/startup/${st.id}` }); toast(granted ? 'Access revoked' : 'Access granted'); }}
                            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${granted ? 'border-rose-400/30 text-rose-300 hover:bg-rose-400/10' : 'a-soft hover:brightness-125'}`}>
                            {granted ? 'Revoke' : 'Grant'}
                          </button>
                        </div>
                      );
                    })
                  ) : <p className="text-[12.5px] text-white/45">Sharing controls are visible to the founding team only.</p>}
                  {isOwner && db.connections.filter(c => c.startupId === st.id && c.status === 'accepted').length === 0 && (
                    <p className="text-[12.5px] text-white/45">Accept a connection first — then grant per-investor access here.</p>
                  )}
                  <p className="!mt-4 rounded-lg bg-white/[.03] px-3 py-2.5 font-mono text-[10.5px] leading-relaxed text-white/35">AUDIT TRAIL: every open, download attempt and share toggle is logged with timestamp + IP.</p>
                </div>
              </Card>
            </div>
          )}

          {tab === 'roadmap' && (
            <Card>
              <CardHead title="Funding & milestones" sub="The journey, versioned" right={<Link to="/app/tracker" className="a-text text-[12px] font-medium hover:brightness-125">Open tracker →</Link>} />
              <div className="p-6">
                <div className="relative ml-2 border-l border-white/10 pl-7">
                  {st.milestones.map((m, i) => (
                    <motion.div key={m.id} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="relative pb-8 last:pb-1">
                      <span className={`absolute -left-[33px] top-1 h-3.5 w-3.5 rounded-full border-2 ${m.status === 'done' ? 'border-emerald-400 bg-emerald-400' : m.status === 'active' ? 'a-stroke a-dot pulse-dot' : 'border-white/25 bg-ink-900'}`} />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-semibold text-white/90">{m.label}</span>
                        {m.amountL && <Chip tone="gold">{fmtL(m.amountL)}</Chip>}
                        <span className="ml-auto font-mono text-[10.5px] text-white/32">{m.date}</span>
                      </div>
                      <p className="mt-1 text-[12.5px] text-white/48">{m.detail}</p>
                      {m.status === 'active' && <div className="mt-2.5 max-w-xs"><Bar value={m.progress} thin /><span className="mt-1 block font-mono text-[10px] text-white/38">{m.progress}% complete</span></div>}
                    </motion.div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* deck preview modal — real PDF, fetched rules-gated from Storage */}
      <Modal open={deckOpen} onClose={() => { setDeckOpen(false); if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); } }} title={<span className="flex items-center gap-2"><FileText size={15} className="a-text" /> {st.deck?.name ?? 'Pitch deck'}</span>} wide>
        {previewUrl ? (
          <iframe title={st.deck?.name ?? 'Pitch deck'} src={previewUrl} className="h-[68vh] w-full rounded-xl border border-white/10 bg-white" />
        ) : (
          <div className="flex h-[40vh] items-center justify-center text-[13px] text-white/45">Loading your secure preview…</div>
        )}
        <p className="mt-3 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/35"><Lock size={11} /> fetched only if Firestore rules permit · access logged to the audit trail</p>
      </Modal>

      {/* edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Quick edit — profile">
        <div className="space-y-4">
          <Field label="Tagline"><Input value={editF.tagline} onChange={e => setEditF(f => ({ ...f, tagline: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Stage"><Input value={editF.stage} onChange={e => setEditF(f => ({ ...f, stage: e.target.value }))} /></Field>
            <Field label="Ask (₹ lakh)"><Input type="number" value={editF.askL} onChange={e => setEditF(f => ({ ...f, askL: +e.target.value }))} /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Btn>
            <Btn onClick={() => { updateStartup(st.id, { tagline: editF.tagline, stage: editF.stage, askL: editF.askL }); setEditOpen(false); toast('Profile saved — matching re-scored'); }}>Save changes</Btn>
          </div>
        </div>
      </Modal>

      <ConnectModal open={connectOpen} onClose={() => setConnectOpen(false)} name={st.name} targetId={st.id} />

      {/* new venture */}
      <Modal open={newVenture} onClose={() => setNewVenture(false)} title="Add another venture">
        <p className="mb-4 text-[12.5px] text-white/50">Founders can run multiple startup profiles — each with its own financials, readiness score and matches. Switch between them from the profile header.</p>
        <div className="space-y-4">
          <Field label="Venture name" required><Input value={nv.name} onChange={e => setNv(f => ({ ...f, name: e.target.value }))} placeholder="Acme Robotics" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Sector"><Textarea rows={1} value={nv.sector} onChange={e => setNv(f => ({ ...f, sector: e.target.value }))} className="!resize-none" /></Field>
            <Field label="Stage"><Input value={nv.stage} onChange={e => setNv(f => ({ ...f, stage: e.target.value }))} /></Field>
            <Field label="Ask (\u20b9 lakh)"><Input type="number" value={nv.askL} onChange={e => setNv(f => ({ ...f, askL: +e.target.value }))} /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" onClick={() => setNewVenture(false)}>Cancel</Btn>
            <Btn disabled={!nv.name.trim()} onClick={async () => {
              const nid = await createStartup({ name: nv.name.trim(), sector: nv.sector || 'SaaS', stage: nv.stage || 'Idea', askL: nv.askL || 100 });
              setNewVenture(false); setNv({ name: '', sector: 'SaaS', stage: 'Idea', askL: 100 });
              if (nid) toast(`“${nv.name}” created — now in focus`);
            }}>Create venture</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ====================================================== INVESTOR PROFILE */
const REPORT_REASONS = ['Misleading or fake profile', 'Impersonation', 'Spam or solicitation', 'Off-platform contact attempts'];

export function InvestorProfile() {
  const { id } = useParams();
  const { db, user, createFlag } = useApp();
  const mine = db.investors.find(i => i.userId === user?.id);
  const inv = (id ? db.investors.find(i => i.id === id) : mine) ?? mine ?? db.investors[0];
  const [connectOpen, setConnectOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportNote, setReportNote] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const ownSt = activeStartup(db, user);
  const m = useMemo(() => (ownSt ? scoreMatch(ownSt, inv) : null), [ownSt, inv]);
  const conn = db.connections.find(c => c.investorId === inv.id && c.startupId === ownSt?.id);
  const isFounderViewer = user?.role === 'founder';
  const scaleMax = 5000;

  return (
    <div className="mx-auto max-w-[1080px]">
      {/* hero */}
      <div className="glass relative overflow-hidden rounded-2xl">
        <div className="h-28 sm:h-36" style={{ background: `linear-gradient(120deg, hsl(${inv.hue} 45% 24%), hsl(${inv.hue + 40} 42% 13%) 60%, hsl(${inv.hue + 80} 40% 18%))` }}>
          <div className="h-full w-full opacity-40" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.14) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        </div>
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-10 flex flex-wrap items-end gap-5">
            <span className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-4 border-ink-950 text-[28px] font-bold text-ink-950 shadow-2xl" style={{ background: `linear-gradient(135deg, hsl(${inv.hue} 62% 66%), hsl(${inv.hue + 30} 58% 46%))` }}>{inv.name.split(' ').map(x => x[0]).join('')}</span>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[24px] font-bold tracking-tight text-white">{inv.name}</h1>
                {inv.verified && <Chip tone="jade"><BadgeCheck size={12} /> Verified investor</Chip>}
                {inv.active && <Chip tone="iris">Actively deploying</Chip>}
              </div>
              <p className="mt-1 text-[13.5px] text-white/60">{inv.title} · <span className="a-text font-medium">{inv.firm}</span></p>
              <div className="mt-1.5 flex flex-wrap gap-4 text-[11.5px] text-white/40">
                <span className="flex items-center gap-1"><MapPin size={11} /> {inv.location}</span>
                <span className="flex items-center gap-1"><Mail size={11} /> {conn?.status === 'accepted' ? inv.email : 'm•••@•••.vc (post-connection)'}</span>
                <span className="flex items-center gap-1"><Phone size={11} /> {conn?.status === 'accepted' ? inv.phone : '+91 ••••• •••••'}</span>
              </div>
            </div>
            {isFounderViewer && (
              <div className="flex gap-2 pb-1">
                <Btn onClick={() => { if (conn) { toast(conn.status === 'accepted' ? 'Already connected — open your room' : 'Request already pending', 'warn'); return; } setConnectOpen(true); }}><Send size={14} /> Send request</Btn>
                <Btn variant="dark" onClick={() => { navigator.clipboard?.writeText(location.href); toast('Profile link copied'); }}><Share2 size={14} /></Btn>
              </div>
            )}
            {!mine && user?.role !== 'admin' && (
              <div className="pb-1">
                <Btn variant="ghost" className="!text-white/40 hover:!text-rose-300" onClick={() => setReportOpen(true)}><FlagIcon size={13} /> Report</Btn>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* thesis */}
          <Card className="p-6">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] a-text">Investment thesis</h3>
            <p className="serif-i mt-3 text-[17.5px] leading-relaxed text-white/85">“{inv.thesis}”</p>
            <p className="mt-4 border-t border-white/[.06] pt-4 text-[13px] leading-relaxed text-white/55">{inv.bio}</p>
          </Card>

          {/* mandate */}
          <Card>
            <CardHead title="Mandate" sub="What gets a fast yes" />
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <div><div className="mb-2 text-[11px] uppercase tracking-wider text-white/35">Sectors</div><div className="flex flex-wrap gap-1.5">{inv.sectors.map(s => <Chip key={s} tone="acc">{s}</Chip>)}</div></div>
              <div><div className="mb-2 text-[11px] uppercase tracking-wider text-white/35">Stages</div><div className="flex flex-wrap gap-1.5">{inv.stages.map(s => <Chip key={s}>{s}</Chip>)}</div></div>
              <div><div className="mb-2 text-[11px] uppercase tracking-wider text-white/35">Geography</div><div className="flex flex-wrap gap-1.5">{inv.geos.map(s => <Chip key={s} tone="iris"><Globe2 size={11} /> {s}</Chip>)}</div></div>
              <div>
                <div className="mb-2 text-[11px] uppercase tracking-wider text-white/35">Cheque range</div>
                <div className="font-mono text-[16px] font-bold text-white">{fmtL(inv.chequeMinL)} – {fmtL(inv.chequeMaxL)}</div>
                <div className="relative mt-2.5 h-1.5 rounded-full bg-white/[.07]">
                  <motion.span className="absolute top-0 h-full rounded-full" style={{ background: 'linear-gradient(90deg, rgb(var(--acc2)), rgb(var(--acc)))', left: `${(inv.chequeMinL / scaleMax) * 100}%` }}
                    initial={{ width: 0 }} animate={{ width: `${((inv.chequeMaxL - inv.chequeMinL) / scaleMax) * 100}%` }} transition={{ duration: 0.9, delay: 0.2 }} />
                </div>
                <div className="mt-1 flex justify-between font-mono text-[9.5px] text-white/30"><span>₹10L</span><span>₹50 Cr</span></div>
              </div>
            </div>
          </Card>

          {/* portfolio */}
          <Card>
            <CardHead title="Selected portfolio" sub="Conviction, publicly" />
            <div className="grid grid-cols-2 gap-3.5 p-5 sm:grid-cols-4">
              {inv.portfolio.map((p, i) => (
                <motion.div key={p.name} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                  className="rounded-xl border border-white/[.08] bg-white/[.03] p-4 text-center transition hover:-translate-y-1 hover:border-white/22">
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-[14px] font-bold text-ink-950" style={{ background: `hsl(${ (inv.hue + i * 40) % 360} 60% 62%)` }}>{p.name.slice(0, 1)}</span>
                  <div className="mt-2.5 text-[13px] font-semibold text-white/90">{p.name}</div>
                  <div className="text-[10.5px] text-white/40">{p.sector}</div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          {/* founder: match panel */}
          {isFounderViewer && m && ownSt && (
            <Card className="overflow-hidden">
              <div className="p-5 pb-4" style={{ background: 'linear-gradient(150deg, rgb(var(--acc)/.12), transparent 60%)' }}>
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-[13px] font-semibold text-white/90"><Landmark size={14} className="a-text" /> Fit with {ownSt.name}</h3>
                  <Tip label={m.signal} wide><Info size={13} className="text-white/35" /></Tip>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <ScoreRing score={m.score} size={78} strokeW={6.5} />
                  <p className="text-[11.5px] leading-relaxed text-white/50">Computed live across sector, stage, cheque and geography — reasoning below.</p>
                </div>
              </div>
              <div className="border-t border-white/[.06] p-5"><AxisBars rows={[
                { label: 'Sector', value: m.sector, note: '' }, { label: 'Stage', value: m.stage, note: '' },
                { label: 'Cheque fit', value: m.cheque, note: '' }, { label: 'Geography', value: m.geo, note: '' },
              ]} /></div>
            </Card>
          )}

          {/* vitals */}
          <Card className="p-5">
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Track record</h3>
            <div className="grid grid-cols-2 gap-3">
              {[['Deals closed', String(inv.deals)], ['Fund AUM', `₹${inv.aumCr.toLocaleString('en-IN')} Cr`], ['Response rate', `${inv.response}%`], ['Median close', `${inv.medCloseDays} days`]].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-white/[.04] p-3.5"><div className="font-mono text-[17px] font-bold text-white">{v}</div><div className="mt-0.5 text-[10.5px] text-white/40">{l}</div></div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Qualifications</h3>
            <ul className="space-y-2">{inv.qualifications.map(q => <li key={q} className="flex items-start gap-2 text-[12.5px] text-white/65"><GraduationCap size={13} className="mt-0.5 shrink-0 a-text" />{q}</li>)}</ul>
            <h3 className="mb-3 mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Collaborations</h3>
            <ul className="space-y-2">{inv.collaborations.map(q => <li key={q} className="flex items-start gap-2 text-[12.5px] text-white/65"><Users size={13} className="mt-0.5 shrink-0 text-iris-300" />{q}</li>)}</ul>
          </Card>
        </div>
      </div>

      <ConnectModal open={connectOpen} onClose={() => setConnectOpen(false)} name={inv.name} targetId={inv.id} />

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report this profile">
        <p className="text-[12.5px] leading-relaxed text-white/50">
          Flagging is routed to the admin moderation queue (<code className="text-white/70">flags</code> collection) and recorded in the
          audit log. Nothing is sent to the profile owner.
        </p>
        <div className="mt-4 space-y-2">
          {REPORT_REASONS.map(r => (
            <button key={r} onClick={() => setReportReason(r)}
              className={`flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[12.5px] transition ${reportReason === r ? 'border-rose-400/40 bg-rose-400/10 text-white' : 'border-white/[.08] text-white/60 hover:border-white/20'}`}>
              <span className={`h-3 w-3 rounded-full border ${reportReason === r ? 'border-rose-300 bg-rose-400' : 'border-white/30'}`} />
              {r}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <Field label="Details (optional)">
            <Textarea rows={3} value={reportNote} onChange={e => setReportNote(e.target.value)} placeholder="Anything the moderator should check…" />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Btn variant="ghost" onClick={() => setReportOpen(false)}>Cancel</Btn>
          <Btn variant="danger" disabled={reportBusy} onClick={async () => {
            setReportBusy(true);
            await createFlag({ type: 'investor', id: inv.id }, reportReason, reportNote.trim() || `Reported: ${reportReason}`);
            setReportBusy(false); setReportOpen(false);
            toast('Thanks — the team will review this profile.');
          }}><FlagIcon size={13} /> Submit report</Btn>
        </div>
      </Modal>
    </div>
  );
}
