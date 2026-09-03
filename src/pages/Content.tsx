import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, HelpCircle, CalendarDays, MapPin, Users2, CheckCircle2, GraduationCap, Clock4,
  PlayCircle, Newspaper, ArrowUpRight, Building2, Bookmark, BookmarkCheck, Search, Sparkles, BookOpen, Landmark,
} from 'lucide-react';
import { Logo, Card, CardHead, Chip, Btn, Bar, Modal, toast, Reveal } from '../components/ui';
import { useApp } from '../lib/store';
import { timeAgo } from '../lib/format';

/* ------------- public chrome (when browsing content while logged out) ---- */
export function PublicChrome({ children }: { children: ReactNode }) {
  return (
    <div data-role="founder" className="min-h-screen bg-ink-950">
      <div className="pointer-events-none fixed inset-0 bg-[url('/img/aurora.jpg')] bg-cover bg-center opacity-[.07]" />
      <header className="sticky top-0 z-40 border-b border-white/[.06] bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
          <Link to="/"><Logo /></Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {[['Events', '/events'], ['Learning', '/learning'], ['Market', '/market'], ['Schemes', '/schemes'], ['News', '/news'], ['FAQ', '/faq']].map(([l, to]) => (
              <Link key={to} to={to} className="rounded-lg px-3 py-2 text-[12.5px] font-medium text-white/55 transition hover:bg-white/[.05] hover:text-white">{l}</Link>
            ))}
          </nav>
          <div className="ml-auto flex gap-2">
            <Link to="/login"><Btn variant="ghost" size="sm">Sign in</Btn></Link>
            <Link to="/signup"><Btn size="sm">Get started</Btn></Link>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-5 py-10">{children}</main>
      <footer className="relative z-10 border-t border-white/[.06] py-8 text-center text-[12px] text-white/30">© {new Date().getFullYear()} VentureSetu · <Link to="/" className="a-text hover:brightness-125">Back to the bridge →</Link></footer>
    </div>
  );
}

function PageHero({ kicker, title, sub }: { kicker: string; title: ReactNode; sub?: string }) {
  return (
    <div className="mb-9">
      <Reveal><span className="a-soft inline-block rounded-full px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">{kicker}</span></Reveal>
      <Reveal delay={0.07}><h1 className="text-display mt-4 text-[30px] font-medium leading-tight tracking-tight text-white sm:text-[38px]">{title}</h1></Reveal>
      {sub && <Reveal delay={0.14}><p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/50">{sub}</p></Reveal>}
    </div>
  );
}

/* ===================================================================== FAQ */
export function FAQBody() {
  const { db } = useApp();
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<number | null>(0);
  const faqs = db.faqs;
  const cats = ['All', ...Array.from(new Set(faqs.map(f => f.cat)))];
  const shown = faqs.filter(f => (cat === 'All' || f.cat === cat) && (f.q + f.a).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mx-auto max-w-3xl">
      <PageHero kicker="Questions, answered" title={<>Frequently asked, <span className="serif-i text-grad-gold">honestly answered</span></>}
        sub="Matching logic, deck privacy, community separation and fees — if it touches your fundraise, it\u2019s documented here." />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search answers…" aria-label="Search FAQ"
            className="w-full rounded-xl border border-white/10 bg-white/[.04] py-2.5 pl-10 pr-4 text-[13px] outline-none transition focus:border-white/25" />
        </div>
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
            className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition ${cat === c ? 'a-soft' : 'border-white/10 text-white/50 hover:border-white/25 hover:text-white/85'}`}>{c}</button>
        ))}
      </div>
      <div className="space-y-2.5">
        {shown.map((f, i) => {
          const isOpen = open === i;
          return (
            <Card key={f.q} className="overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}
                className="flex w-full items-center gap-4 px-5 py-4 text-left">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${isOpen ? 'a-soft' : 'bg-white/[.05] text-white/40'}`}><HelpCircle size={15} /></span>
                <span className="flex-1 text-[14px] font-semibold text-white/90">{f.q}</span>
                <Chip className="hidden !text-[9.5px] uppercase tracking-wider sm:inline-flex">{f.cat}</Chip>
                <ChevronDown size={15} className={`shrink-0 text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180 a-text' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: [0.22, 0.8, 0.3, 1] }}>
                    <p className="border-t border-white/[.06] bg-white/[.02] px-5 py-4 pl-[68px] text-[13px] leading-relaxed text-white/60">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
        {shown.length === 0 && (
          <Card className="p-10 text-center text-[13px] text-white/45">
            {faqs.length === 0 ? 'No FAQs published yet — the platform team adds these live from Firestore.' : `Nothing matched “${q}”. Try “deck”, “matching”, “security”…`}
          </Card>
        )}
      </div>
      <Card className="mt-6 flex flex-wrap items-center gap-4 p-5">
        <div className="flex-1"><div className="text-[14px] font-semibold text-white">Still curious?</div><div className="text-[12.5px] text-white/45">The founder community answers faster than any help centre.</div></div>
        <Link to="/signup"><Btn size="sm"><Sparkles size={13} /> Join the network</Btn></Link>
      </Card>
    </div>
  );
}

/* ================================================================== EVENTS */
export function EventsBody() {
  const { db, rsvp, user } = useApp();
  const nav = useNavigate();
  const events = db.events;
  const featured = events.find(e => e.featured) ?? events[0];
  const rest = events.filter(e => e.id !== featured?.id);
  const Seat = ({ e }: { e: (typeof events)[number] }) => {
    const mine = !!e.mine;
    const left = e.left;
    const booked = Math.max(0, Math.round(((e.seats - left) / Math.max(1, e.seats)) * 100));
    return (
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[10.5px] text-white/40"><span>{left} seats left of {e.seats}</span><span>{booked}% booked</span></div>
        <Bar value={booked} thin tone={left < 20 ? 'rose' : 'gold'} />
        <Btn size="sm" variant={mine ? 'outline' : 'accent'} className="mt-3 w-full" disabled={!mine && left <= 0}
          onClick={async () => {
            if (!user) { nav('/login'); return; }
            await rsvp(e.id);
            toast(mine ? 'RSVP released' : `Seat locked for “${e.title}”`);
          }}>
          {mine ? <><CheckCircle2 size={13} className="text-emerald-400" /> You\u2019re in — release</> : left <= 0 ? 'Waitlist' : 'Reserve seat'}
        </Btn>
      </div>
    );
  };
  if (events.length === 0) {
    return (
      <div>
        <PageHero kicker="Rooms that matter" title={<>Funding <span className="serif-i text-grad-gold">events</span>, curated</>}
          sub="Demo days, term-sheet tear-downs and regulator roundtables — RSVP directly with your verified profile." />
        <Card className="p-12 text-center">
          <div className="text-[14.5px] font-semibold text-white">No events scheduled yet</div>
          <p className="mt-1.5 text-[12.5px] text-white/45">Events appear here live from Firestore as the platform team publishes them.</p>
        </Card>
      </div>
    );
  }
  return (
    <div>
      <PageHero kicker="Rooms that matter" title={<>Funding <span className="serif-i text-grad-gold">events</span>, curated</>}
        sub="Demo days, term-sheet tear-downs, regulator roundtables and angel open houses — RSVP directly with your verified profile." />
      <Reveal>
        <Card className="relative mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/img/network.jpg')] bg-cover bg-center opacity-[.14]" />
          <div className="relative grid gap-6 p-7 lg:grid-cols-[1fr_300px]">
            <div>
              <div className="flex flex-wrap items-center gap-2"><Chip tone="gold">FEATURED · DEMO DAY</Chip><Chip>{featured.kind}</Chip></div>
              <h2 className="text-display mt-3 text-[26px] font-medium text-white sm:text-[32px]">{featured.title}</h2>
              <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-white/58">{featured.desc}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-[12px] text-white/50">
                <span className="flex items-center gap-1.5"><CalendarDays size={13} className="a-text" /> {featured.date} · {featured.time}</span>
                <span className="flex items-center gap-1.5"><MapPin size={13} className="a-text" /> {featured.where}</span>
                <span className="flex items-center gap-1.5"><Users2 size={13} className="a-text" /> {featured.host}</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-ink-950/60 p-4 backdrop-blur-md"><Seat e={featured} /></div>
          </div>
        </Card>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((e, i) => (
          <Reveal key={e.id} delay={i * 0.06}>
            <Card hover className="flex h-full flex-col p-5">
              <div className="flex items-center justify-between">
                <Chip tone="iris">{e.kind}</Chip>
                <span className="flex items-center gap-1 font-mono text-[10px] text-white/35"><Clock4 size={10} /> {e.time}</span>
              </div>
              <h3 className="mt-3 text-[15.5px] font-semibold leading-snug text-white">{e.title}</h3>
              <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-white/48">{e.desc}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-white/42">
                <span className="flex items-center gap-1.5"><CalendarDays size={11} className="a-text" />{e.date}</span>
                <span className="flex items-center gap-1.5"><MapPin size={11} className="a-text" />{e.where}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">{e.tags.map(t => <Chip key={t} className="!px-2 !py-0 !text-[10px]">{t}</Chip>)}</div>
              <Seat e={e} />
            </Card>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ================================================================ LEARNING */
export function LearningBody() {
  const { db, user, progressLesson } = useApp();
  const nav = useNavigate();
  const [modal, setModal] = useState<string | null>(null);
  const track = db.tracks.find(tr => tr.id === modal);
  return (
    <div>
      <PageHero kicker="Operator-grade curriculum" title={<>The <span className="serif-i text-grad-gold">Learning Studio</span></>}
        sub="Fundraising, finance, legal and GTM tracks — written from the investor side of the table, with worksheets that plug into your profile." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {db.tracks.map((tr, i) => {
          const pct = Math.round((tr.done / tr.lessons) * 100);
          return (
            <Reveal key={tr.id} delay={i * 0.06}>
              <Card hover className="group flex h-full cursor-pointer flex-col p-5" >
                <button className="flex-1 text-left" onClick={() => setModal(tr.id)}>
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-ink-950" style={{ background: `linear-gradient(135deg, hsl(${tr.hue} 62% 66%), hsl(${tr.hue + 30} 58% 44%))` }}><BookOpen size={17} /></span>
                  <div className="flex items-center gap-2"><Chip tone={tr.level === 'Core' ? 'gold' : tr.level === 'Advanced' ? 'rose' : 'iris'}>{tr.level}</Chip><span className="flex items-center gap-1 text-[11px] text-white/38"><Clock4 size={10} /> {tr.mins} min · {tr.lessons} lessons</span></div>
                  <h3 className="mt-2.5 text-[16px] font-semibold leading-snug text-white group-hover:a-text">{tr.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-white/48">{tr.desc}</p>
                  <p className="mt-2 text-[11px] text-white/35">by {tr.author}</p>
                </button>
                <div className="mt-4 border-t border-white/[.06] pt-3.5">
                  <div className="mb-1.5 flex justify-between text-[10.5px] text-white/40"><span>{tr.done}/{tr.lessons} lessons</span><span className="font-mono">{pct}%</span></div>
                  <Bar value={pct} thin tone={pct === 100 ? 'jade' : 'acc'} />
                  <Btn size="sm" variant={tr.done > 0 ? 'accent' : 'outline'} className="mt-3 w-full"
                    onClick={() => { if (!user) { nav('/login'); return; } progressLesson(tr.id); toast(tr.done + 1 >= tr.lessons ? `“${tr.title}” completed — certificate issued` : 'Lesson completed — progress saved'); }}>
                    <PlayCircle size={13} /> {tr.done === 0 ? 'Start track' : tr.done >= tr.lessons ? 'Replay track' : `Continue · L${tr.done + 1}`}
                  </Btn>
                </div>
              </Card>
            </Reveal>
          );
        })}
      </div>
      <Modal open={!!track} onClose={() => setModal(null)} title={track?.title ?? ''}>
        {track && (
          <div>
            <p className="text-[13px] leading-relaxed text-white/60">{track.desc}</p>
            <div className="mt-4 space-y-2">
              {Array.from({ length: track.lessons }).map((_, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-[12.5px] ${i < track.done ? 'border-emerald-400/20 bg-emerald-400/[.05] text-white/70' : 'border-white/[.08] text-white/45'}`}>
                  {i < track.done ? <CheckCircle2 size={14} className="text-emerald-400" /> : <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/25 font-mono text-[8px]">{i + 1}</span>}
                  <span className="flex-1">Lesson {i + 1}: {['Orientation', 'Core frameworks', 'Case teardown', 'Worksheet sprint', 'Live Q&A'][i % 5]}</span>
                  <span className="font-mono text-[10px] text-white/30">{14 + i * 3}m</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11.5px] text-white/40">Mentor: {track.author} · graduation adds a verified credential to your profile.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ================================================================= SCHEMES */
export function SchemesBody() {
  const { db } = useApp();
  const schemes = db.schemes;
  const [saved, setSaved] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div>
      <PageHero kicker="Public money, private speed" title={<>Schemes & <span className="serif-i text-grad-gold">policies</span> worth your cap table</>}
        sub="Non-dilutive grants, fund-of-funds and credit guarantees — decoded into plain eligibility, with one-tap shortlists." />
      <div className="grid gap-4 md:grid-cols-2">
        {schemes.length === 0 && (
          <Card className="p-12 text-center sm:col-span-2">
            <div className="text-[14.5px] font-semibold text-white">No schemes published yet</div>
            <p className="mt-1.5 text-[12.5px] text-white/45">Grants, fund-of-funds and guarantees appear here live from Firestore as they're curated.</p>
          </Card>
        )}
        {schemes.map((s, i) => {
          const isOpen = open === s.id;
          const isSaved = saved.includes(s.id);
          return (
            <Reveal key={s.id} delay={i * 0.05}>
              <Card hover className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, hsl(${s.hue} 55% 45%), hsl(${s.hue + 30} 50% 30%))` }}><Landmark size={17} /></span>
                  <button onClick={() => { setSaved(p => isSaved ? p.filter(x => x !== s.id) : [...p, s.id]); toast(isSaved ? 'Removed from shortlist' : 'Shortlisted — shared with your CA packet'); }} aria-label="Shortlist"
                    className={`rounded-lg p-2 transition ${isSaved ? 'a-text' : 'text-white/35 hover:text-white/75'}`}>
                    {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  </button>
                </div>
                <h3 className="mt-3 text-[16px] font-semibold leading-snug text-white">{s.name}</h3>
                <p className="mt-0.5 text-[11.5px] text-white/38">{s.by}</p>
                <p className="mt-3 flex-1 text-[13px] font-medium leading-relaxed text-gold-200/90">{s.benefit}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Chip tone="neutral">{s.stage}</Chip>
                  {s.sector.map(sc => <Chip key={sc}>{sc}</Chip>)}
                  <Chip tone={s.deadline === 'Rolling' ? 'jade' : 'rose'}><Clock4 size={10} /> {s.deadline}</Chip>
                </div>
                <button onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen}
                  className="mt-4 flex items-center gap-1.5 self-start text-[12px] font-medium a-text transition hover:brightness-125">
                  Eligibility {isOpen ? '−' : '+'}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                      className="mt-2 space-y-1.5 overflow-hidden border-t border-white/[.07] pt-3">
                      {s.elig.map(e => <li key={e} className="flex items-start gap-2 text-[12.5px] text-white/60"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-400" />{e}</li>)}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </Card>
            </Reveal>
          );
        })}
      </div>
      <Card className="mt-6 flex flex-wrap items-center gap-4 p-5">
        <div className="flex-1"><div className="text-[14px] font-semibold text-white">{saved.length} scheme{saved.length === 1 ? '' : 's'} shortlisted</div><div className="text-[12.5px] text-white/45">Export a CA-ready application packet with documents checklist.</div></div>
        <Btn size="sm" variant="outline" disabled={saved.length === 0} onClick={() => toast('Packet exported — check notifications')}>Export packet <ArrowUpRight size={13} /></Btn>
      </Card>
    </div>
  );
}

/* ==================================================================== NEWS */
export function NewsBody() {
  const { db } = useApp();
  const news = db.news;
  const [tag, setTag] = useState('All');
  const tags = useMemo(() => ['All', ...Array.from(new Set(news.map(n => n.tag)))], [news]);
  const featured = news.find(n => n.featured) ?? news[0];
  const feed = news.filter(n => n.id !== featured?.id && (tag === 'All' || n.tag === tag));
  const [openArt, setOpenArt] = useState<string | null>(null);
  const art = news.find(n => n.id === openArt);
  if (news.length === 0) {
    return (
      <div>
        <PageHero kicker="Signal, not noise" title={<>Startup <span className="serif-i text-grad-gold">news desk</span></>}
          sub="Funding pulse, policy moves and operator playbooks — edited down to what changes your week." />
        <Card className="p-12 text-center">
          <div className="text-[14.5px] font-semibold text-white">No stories yet</div>
          <p className="mt-1.5 text-[12.5px] text-white/45">Stories are published live from Firestore by the editorial team.</p>
        </Card>
      </div>
    );
  }
  return (
    <div>
      <PageHero kicker="Signal, not noise" title={<>Startup <span className="serif-i text-grad-gold">news desk</span></>}
        sub="Funding pulse, policy moves and operator playbooks — edited down to what changes your week." />
      <button onClick={() => setOpenArt(featured.id)} className="group mb-6 block w-full text-left">
        <Reveal><Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/img/aurora.jpg')] bg-cover bg-center opacity-20" />
          <div className="relative p-7">
            <div className="flex flex-wrap items-center gap-2"><Chip tone="gold">LEAD STORY</Chip><Chip>{featured.tag}</Chip><span className="font-mono text-[10.5px] text-white/35">{featured.mins} min read</span></div>
            <h2 className="text-display mt-3 max-w-3xl text-[24px] font-medium leading-snug text-white transition group-hover:text-gold-100 sm:text-[30px]">{featured.title}</h2>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-white/55">{featured.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium a-text">Read analysis <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
          </div>
        </Card></Reveal>
      </button>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {tags.map(tp => (
          <button key={tp} onClick={() => setTag(tp)} aria-pressed={tag === tp}
            className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition ${tag === tp ? 'a-soft' : 'border-white/10 text-white/50 hover:border-white/25 hover:text-white/85'}`}>{tp}</button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {feed.map((n, i) => (
          <Reveal key={n.id} delay={i * 0.05}>
            <button onClick={() => setOpenArt(n.id)} className="group block h-full w-full text-left">
              <Card hover className="flex h-full flex-col p-5">
                <div className="flex items-center justify-between"><Chip tone="iris">{n.tag}</Chip><span className="font-mono text-[10px] text-white/30">{timeAgo(n.ts)}</span></div>
                <h3 className="mt-3 flex-1 text-[15px] font-semibold leading-snug text-white group-hover:a-text">{n.title}</h3>
                <p className="mt-2 line-clamp-2 text-[12.5px] text-white/46">{n.desc}</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/[.06] pt-3 text-[11px] text-white/38">
                  <span className="flex items-center gap-1.5"><Newspaper size={11} /> {n.src}</span>
                  <span className="font-mono">{n.mins} min</span>
                </div>
              </Card>
            </button>
          </Reveal>
        ))}
      </div>
      <Modal open={!!art} onClose={() => setOpenArt(null)} title={<span className="flex items-center gap-2"><Newspaper size={14} className="a-text" /> {art?.tag}</span>} wide>
        {art && (
          <article>
            <h2 className="text-display text-[24px] font-medium leading-snug text-white">{art.title}</h2>
            <p className="mt-2 flex items-center gap-3 text-[11.5px] text-white/40">{art.src} · {timeAgo(art.ts)} · {art.mins} min read</p>
            <div className="mt-5 space-y-4 text-[13.5px] leading-relaxed text-white/68">
              <p className="text-[15px] font-medium text-white/85">{art.desc}</p>
              <p>The underlying pattern: capital is concentrating around evidence. Rounds that clear in under 40 days share three traits — a quantified wedge, a verified data trail, and warmth built beforethe need. Platforms that compress diligence are absorbing the liquidity that broad marketplaces lost.</p>
              <p>For founders, the actionable read is timing: seed windows are widest when your metric cadence is already investor-grade. For investors, the read is velocity bias — the best profiles now arrive pre-diligenced, so conviction cycles shorten from weeks to days.</p>
              <p className="rounded-xl border border-white/[.08] bg-white/[.03] p-4 font-mono text-[11px] leading-relaxed text-white/45">Analysis continues in the {art.tag} channel of your community — join with a verified account to read member discussion and download the raw dataset.</p>
            </div>
          </article>
        )}
      </Modal>
      <Card className="mt-8 flex flex-wrap items-center gap-4 p-5">
        <GraduationCap size={20} className="a-text" />
        <div className="min-w-[200px] flex-1"><div className="text-[14px] font-semibold text-white">The Monday Signal</div><div className="text-[12.5px] text-white/45">One research email a week. 41,000 operators read it before standup.</div></div>
        <div className="flex gap-2">
          <input placeholder="you@company.in" aria-label="Newsletter email" className="w-52 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-[13px] outline-none transition focus:border-white/25" id="nl-email" />
          <Btn size="sm" onClick={() => { toast('Subscribed — first Signal lands Monday 7am IST'); (document.getElementById('nl-email') as HTMLInputElement).value = ''; }}>Subscribe</Btn>
        </div>
      </Card>
    </div>
  );
}

/* ================================================================== MARKET */
export function MarketBody() {
  const { user, db } = useApp();
  const nav = useNavigate();
  const programs = db.market;
  const [req, setReq] = useState<string[]>([]);
  return (
    <div>
      <PageHero kicker="Beyond capital" title={<>Market <span className="serif-i text-grad-gold">access</span> programs</>}
        sub="Revenue is the best round. Curated corridors into government procurement, enterprises, exports and global demo days." />
      <div className="grid gap-4 md:grid-cols-2">
        {programs.length === 0 && (
          <Card className="p-12 text-center sm:col-span-2">
            <div className="text-[14.5px] font-semibold text-white">No market programs yet</div>
            <p className="mt-1.5 text-[12.5px] text-white/45">Procurement corridors, enterprise pilots and export programs appear here live from Firestore.</p>
          </Card>
        )}
        {programs.map((m, i) => {
          const asked = req.includes(m.id);
          return (
            <Reveal key={m.id} delay={i * 0.06}>
              <Card hover className="flex h-full flex-col p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-950" style={{ background: `linear-gradient(135deg, hsl(${m.hue} 62% 64%), hsl(${m.hue + 30} 58% 44%))` }}><Building2 size={17} /></span>
                  <Chip tone="iris">{m.kind}</Chip>
                </div>
                <h3 className="mt-3.5 text-[17px] font-semibold text-white">{m.title}</h3>
                <p className="mt-0.5 text-[11.5px] text-white/38">{m.org}</p>
                <p className="mt-2.5 flex-1 text-[13px] leading-relaxed text-white/55">{m.desc}</p>
                <ul className="mt-3.5 space-y-1.5">
                  {m.points.map(p => <li key={p} className="flex items-start gap-2 text-[12.5px] text-white/62"><CheckCircle2 size={13} className="mt-0.5 shrink-0 a-text" />{p}</li>)}
                </ul>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex flex-wrap gap-1.5">{m.tags.map(t => <Chip key={t} className="!px-2 !py-0 !text-[10px]">{t}</Chip>)}</div>
                  <Btn size="sm" variant={asked ? 'outline' : 'accent'} className="ml-auto"
                    onClick={() => { if (!user) { nav('/login'); return; } setReq(p => asked ? p.filter(x => x !== m.id) : [...p, m.id]); toast(asked ? 'Request withdrawn' : 'Application window opened — curators respond in 5 working days'); }}>
                    {asked ? <><CheckCircle2 size={13} className="text-emerald-400" /> Requested</> : 'Request access'}
                  </Btn>
                </div>
              </Card>
            </Reveal>
          );
        })}
      </div>
      <Card className="mt-8 grid gap-5 p-6 sm:grid-cols-3">
        {[['41%', 'of member startups land a pilot within 90 days'], ['₹280 Cr', 'in purchase orders routed via GeM & enterprise lounges'], ['14', 'cities covered by corridor trips this year']].map(([v, l]) => (
          <div key={l} className="text-center sm:text-left"><div className="font-mono text-[26px] font-bold a-text">{v}</div><div className="mt-1 text-[12px] leading-snug text-white/48">{l}</div></div>
        ))}
      </Card>
    </div>
  );
}
