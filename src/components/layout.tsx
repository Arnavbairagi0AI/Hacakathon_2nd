import { useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Sparkles, MessageSquare, Users, Compass, Landmark, GraduationCap,
  Rocket, ShieldCheck, Bell, Search, Globe, LogOut,
  Briefcase, GitBranch, Building2, UserRound, CircleHelp, X, ChevronRight, Menu, Newspaper, HelpCircle,
} from 'lucide-react';
import { useApp } from '../lib/store';
import { useI18n, langs } from '../lib/i18n';
import { Logo, Avatar, Chip, toast } from './ui';
import type { Role } from '../lib/types';
import { timeAgo } from '../lib/format';

/* ============================================================ nav config */
interface NavItem { to: string; icon: ReactNode; key?: string; label?: string; badge?: number }
interface NavSection { key: 'sec.overview' | 'sec.network' | 'sec.resources'; labelI: string; items: NavItem[] }

function useNav(): NavSection[] {
  const { user, db } = useApp();
  const unreadN = (user?.role === 'investor' ? db.noticesI : db.noticesF).filter(n => !n.read).length;
  const connections = db.connections.filter(c => {
    if (user?.role === 'founder') { const own = db.startups.find(s => s.ownerId === user.id); return own ? c.startupId === own.id : false; }
    if (user?.role === 'investor') { const inv = db.investors.find(i => i.userId === user.id); return inv ? c.investorId === inv.id : false; }
    return false;
  });
  const pendingIn = connections.filter(c => c.status === 'pending' && c.fromRole !== user?.role).length;

  if (user?.role === 'admin') {
    return [
      { key: 'sec.overview', labelI: 'nav.dashboard', items: [
        { to: '/app/admin', icon: <ShieldCheck size={17} />, key: 'nav.admin' },
        { to: '/app/notifications', icon: <Bell size={17} />, key: 'nav.notifications', badge: unreadN },
      ]},
      { key: 'sec.resources', labelI: 'sec.resources', items: resItems() },
    ];
  }
  const founder = user?.role === 'founder';
  return [
    { key: 'sec.overview', labelI: 'sec.overview', items: [
      { to: '/app/dashboard', icon: <LayoutDashboard size={17} />, key: 'nav.dashboard' },
      { to: founder ? '/app/startup/own' : '/app/profile', icon: founder ? <Rocket size={17} /> : <UserRound size={17} />, key: founder ? 'nav.profileF' : 'nav.profileI' },
      { to: '/app/tracker', icon: <GitBranch size={17} />, key: founder ? 'nav.tracker' : 'nav.pipeline' },
      { to: '/app/notifications', icon: <Bell size={17} />, key: 'nav.notifications', badge: unreadN },
    ]},
    { key: 'sec.network', labelI: 'sec.network', items: [
      { to: '/app/matching', icon: <Sparkles size={17} />, key: 'nav.matching' },
      { to: '/app/connections', icon: <Compass size={17} />, label: founder ? 'Connections' : 'Opportunities', badge: pendingIn },
      { to: '/app/messages', icon: <MessageSquare size={17} />, key: 'nav.messages' },
      { to: '/app/community', icon: <Users size={17} />, key: 'nav.community' },
    ]},
    { key: 'sec.resources', labelI: 'sec.resources', items: resItems() },
  ];
}
function resItems(): NavItem[] {
  return [
    { to: '/app/events', icon: <Landmark size={17} />, key: 'nav.events' },
    { to: '/app/learning', icon: <GraduationCap size={17} />, key: 'nav.learning' },
    { to: '/app/market', icon: <Building2 size={17} />, key: 'nav.market' },
    { to: '/app/schemes', icon: <Briefcase size={17} />, key: 'nav.schemes' },
    { to: '/app/news', icon: <Newspaper size={17} />, key: 'nav.news' },
    { to: '/app/faq', icon: <HelpCircle size={17} />, key: 'nav.faq' },
  ];
}

/* ================================================================ guards */
export function Splash({ note }: { note?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-ink-950">
      <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }}>
        <Logo size={44} />
      </motion.div>
      <div className="flex items-center gap-2 text-[13px] text-white/40">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/15 border-t-gold-400" />
        {note ?? 'Preparing your workspace…'}
      </div>
    </div>
  );
}

export function Guard({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user, ready } = useApp();
  const loc = useLocation();
  if (!ready) return <Splash note="Decrypting secure session…" />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/app/dashboard" replace />;
  if (!user.onboarded && user.role !== 'admin') return <Navigate to={`/onboarding/${user.role}`} replace />;
  return <>{children}</>;
}

/* ================================================================ topbar */
function TopSearch() {
  const { db, user } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const results = useMemo(() => {
    if (!q.trim()) return [];
    const needle = q.toLowerCase();
    type R = { label: string; sub: string; to: string; icon: ReactNode };
    const out: R[] = [];
    db.startups.forEach(s => { if (s.name.toLowerCase().includes(needle) || s.sector.toLowerCase().includes(needle)) out.push({ label: s.name, sub: `${s.sector} · ${s.stage}`, to: `/app/startup/${s.id}`, icon: <Rocket size={14} /> }); });
    db.investors.forEach(i => { if (i.name.toLowerCase().includes(needle) || i.firm.toLowerCase().includes(needle)) out.push({ label: i.name, sub: `${i.firm} · ${i.title}`, to: `/app/investor/${i.id}`, icon: <Landmark size={14} /> }); });
    return out.slice(0, 6);
  }, [q, db, user]);
  return (
    <div className="relative hidden min-w-0 flex-1 max-w-md md:block">
      <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
      <input
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search startups, investors…"
        aria-label="Global search"
        className="w-full rounded-xl border border-white/[.08] bg-white/[.04] py-2 pl-10 pr-14 text-[13px] text-white/85 placeholder:text-white/30 outline-none transition focus:border-white/20 focus:bg-white/[.06]"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-white/[.05] px-1.5 py-0.5 font-mono text-[10px] text-white/35">⌘K</kbd>
      <AnimatePresence>
        {open && q.trim() && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="glass-deep absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl">
            {results.length === 0 && <div className="px-4 py-6 text-center text-[12.5px] text-white/40">No matches for “{q}”</div>}
            {results.map(r => (
              <button key={r.to + r.label} onMouseDown={() => { nav(r.to); setOpen(false); setQ(''); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/[.05]">
                <span className="a-soft flex h-7 w-7 items-center justify-center rounded-lg">{r.icon}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-white/90">{r.label}</span>
                  <span className="block truncate text-[11px] text-white/40">{r.sub}</span>
                </span>
                <ChevronRight size={14} className="ml-auto text-white/25" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BellMenu() {
  const { db, user, markRead } = useApp();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const role = user?.role === 'investor' ? 'investor' : 'founder';
  const list = (role === 'founder' ? db.noticesF : db.noticesI).slice(0, 6);
  const unread = (role === 'founder' ? db.noticesF : db.noticesI).filter(n => !n.read).length;
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[.08] bg-white/[.04] text-white/70 transition hover:border-white/20 hover:text-white">
        <Bell size={16} />
        {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 font-mono text-[9.5px] font-bold text-ink-950">{unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4 }}
              className="glass-deep absolute right-0 z-50 mt-2 w-[340px] overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between border-b border-white/[.07] px-4 py-3">
                <span className="text-[13px] font-semibold text-white/90">Notifications</span>
                <button onClick={() => { markRead(role); setOpen(false); }} className="text-[11px] font-medium text-gold-300 hover:text-gold-200">Mark all read</button>
              </div>
              <div className="max-h-[380px] overflow-auto">
                {list.map(n => (
                  <button key={n.id} onClick={() => { markRead(role, n.id); setOpen(false); nav(n.link); }}
                    className="flex w-full items-start gap-3 border-b border-white/[.04] px-4 py-3 text-left transition hover:bg-white/[.04]">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-white/15' : 'a-dot pulse-dot'}`} />
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-medium text-white/88">{n.title}</span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-white/45">{n.body}</span>
                      <span className="mt-1 block font-mono text-[10px] text-white/30">{timeAgo(n.ts)}</span>
                    </span>
                  </button>
                ))}
              </div>
              <Link to="/app/notifications" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-center text-[12px] font-medium text-gold-300 transition hover:bg-white/[.04]">Open notification centre</Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function LangMenu() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} aria-label="Language" title="Language / भाषा"
        className="flex h-9 items-center gap-1.5 rounded-xl border border-white/[.08] bg-white/[.04] px-3 text-[12px] font-medium text-white/70 transition hover:border-white/20 hover:text-white">
        <Globe size={15} /><span className="hidden sm:inline">{langs.find(l => l.id === lang)?.label}</span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              className="glass-deep absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl p-1">
              {langs.map(l => (
                <button key={l.id} onClick={() => { setLang(l.id); setOpen(false); toast(`Language switched to ${l.label}`); }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[12.5px] transition ${lang === l.id ? 'bg-white/[.08] text-white' : 'text-white/60 hover:bg-white/[.05] hover:text-white'}`}>
                  {l.label}{lang === l.id && <span className="a-text">●</span>}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function AvatarMenu() {
  const { user, logout } = useApp();
  const { t } = useI18n();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} aria-label="Account menu" className="rounded-full transition hover:scale-105 active:scale-95">
        <Avatar name={user.name} hue={user.hue} size={36} online />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4 }}
              className="glass-deep absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl">
              <div className="border-b border-white/[.07] px-4 py-3.5">
                <div className="text-[13.5px] font-semibold text-white/92">{user.name}</div>
                <div className="truncate text-[11.5px] text-white/40">{user.email}</div>
                <div className="mt-2 flex gap-1.5">
                  <Chip tone={user.role === 'founder' ? 'gold' : user.role === 'investor' ? 'iris' : 'rose'} className="capitalize">{user.role}</Chip>
                  {user.mfa && <Chip tone="jade">MFA on</Chip>}
                </div>
              </div>
              <div className="p-1.5">
                {user.role === 'founder' && <MenuLink label="My startup profile" onClick={() => { nav('/app/startup/own'); setOpen(false); }} />}
                {user.role === 'investor' && <MenuLink label="My investor profile" onClick={() => { nav('/app/profile'); setOpen(false); }} />}
                <MenuLink label="Notifications" onClick={() => { nav('/app/notifications'); setOpen(false); }} />
                <div className="my-1 border-t border-white/[.06]" />
                <MenuLink label={t('nav.logout')} icon={<LogOut size={14} />} danger onClick={() => { logout(); setOpen(false); nav('/'); toast('Signed out — session cleared'); }} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
function MenuLink({ label, icon, onClick, danger }: { label: string; icon?: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12.5px] transition ${danger ? 'text-rose-300 hover:bg-rose-400/10' : 'text-white/70 hover:bg-white/[.06] hover:text-white'}`}>
      {icon}{label}
    </button>
  );
}

/* ================================================================ shell */
export function AppShell() {
  const { user } = useApp();
  const { t } = useI18n();
  const nav = useNav();
  const loc = useLocation();
  const [drawer, setDrawer] = useState(false);
  const role = user?.role ?? 'founder';

  const tabs: NavItem[] = []; // (kept for parity; mobile tab selection is hard-coded below)
  const mobileTabs: NavItem[] = [
    { to: '/app/dashboard', icon: <LayoutDashboard size={18} />, label: 'Home' },
    { to: '/app/matching', icon: <Sparkles size={18} />, label: 'Match' },
    { to: '/app/community', icon: <Users size={18} />, label: 'Community' },
    { to: '/app/messages', icon: <MessageSquare size={18} />, label: 'Chat' },
    { to: '/app/tracker', icon: <GitBranch size={18} />, label: role === 'investor' ? 'Pipeline' : 'Tracker' },
  ];
  void tabs;

  return (
    <div data-role={role} className="min-h-screen bg-ink-950">
      {/* ambient backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="aurora-pan absolute inset-0 bg-[url('/img/aurora.jpg')] bg-cover bg-center opacity-[.10]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/40 via-ink-950/75 to-ink-950" />
      </div>

      {/* sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-white/[.06] bg-ink-900/60 backdrop-blur-xl lg:flex">
        <div className="px-5 pb-4 pt-5"><Link to="/" aria-label="VentureSetu home"><Logo /></Link></div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6" aria-label="Primary">
          {nav.map(sec => (
            <div key={sec.key}>
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">{t(sec.labelI)}</div>
              <div className="space-y-0.5">
                {sec.items.map(item => (
                  <NavLink key={item.to} to={item.to} end={item.to === '/app/dashboard'}
                    className={({ isActive }) => `group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all ${isActive ? 'text-white' : 'text-white/50 hover:bg-white/[.045] hover:text-white/85'}`}>
                    {({ isActive }) => (
                      <>
                        {isActive && <motion.span layoutId="nav-active" className="absolute inset-0 -z-0 rounded-xl border border-white/[.09] bg-white/[.06]" />}
                        <span className={`relative z-10 transition-transform group-hover:scale-110 ${isActive ? 'a-text' : ''}`}>{item.icon}</span>
                        <span className="relative z-10">{item.key ? t(item.key) : item.label}</span>
                        {!!item.badge && item.badge > 0 && (
                          <span className="relative z-10 ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500/90 px-1 font-mono text-[10px] font-bold text-white">{item.badge}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="m-3 rounded-xl border border-white/[.07] bg-white/[.03] p-3.5">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-white/85"><ShieldCheck size={14} className="text-emerald-400" /> Role-gated access</div>
          <p className="mt-1 text-[11px] leading-snug text-white/40">Every read and write is enforced by Firestore Security Rules — not just the UI.</p>
        </div>
      </aside>

      {/* content column */}
      <div className="relative z-10 flex min-h-screen flex-col lg:pl-[248px]">
        {/* topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[.06] bg-ink-950/70 px-4 backdrop-blur-xl sm:px-6">
          <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[.08] text-white/70 lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu"><Menu size={17} /></button>
          <div className="lg:hidden"><Logo size={26} word={false} /></div>
          <TopSearch />
          <div className="ml-auto flex items-center gap-2.5">
            <LangMenu />
            <BellMenu />
            <AvatarMenu />
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:pb-12 xl:px-8">
          <AnimatePresence mode="wait">
            <motion.div key={loc.pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.22, 0.8, 0.3, 1] }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-white/[.08] bg-ink-950/88 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Mobile">
        {mobileTabs.map(t2 => (
          <NavLink key={t2.to} to={t2.to} className={({ isActive }) => `flex flex-col items-center gap-1 px-3 py-2.5 text-[10px] font-medium ${isActive ? 'a-text' : 'text-white/40'}`}>
            {t2.icon}{t2.label}
          </NavLink>
        ))}
        <button onClick={() => setDrawer(true)} className="flex flex-col items-center gap-1 px-3 py-2.5 text-[10px] font-medium text-white/40">
          <CircleHelp size={18} /> More
        </button>
      </nav>

      {/* mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-[80]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDrawer(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="glass-deep absolute inset-y-0 left-0 flex w-[280px] flex-col p-4">
              <div className="mb-4 flex items-center justify-between">
                <Logo size={28} />
                <button onClick={() => setDrawer(false)} aria-label="Close menu" className="rounded-lg p-1.5 text-white/50 hover:bg-white/[.07]"><X size={18} /></button>
              </div>
              <nav className="flex-1 space-y-5 overflow-y-auto">
                {nav.map(sec => (
                  <div key={sec.key}>
                    <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">{t(sec.labelI)}</div>
                    <div className="space-y-0.5">
                      {sec.items.map(item => (
                        <NavLink key={item.to} to={item.to} onClick={() => setDrawer(false)}
                          className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium ${isActive ? 'bg-white/[.07] text-white' : 'text-white/55'}`}>
                          {item.icon}<span>{item.key ? t(item.key) : item.label}</span>
                          {!!item.badge && item.badge > 0 && <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500/90 px-1 font-mono text-[10px] font-bold text-white">{item.badge}</span>}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ========================================================= admin helpers */
export function AdminBadge() { return <Chip tone="rose">ADMIN</Chip>; }
