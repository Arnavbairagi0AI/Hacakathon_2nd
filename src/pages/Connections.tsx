import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Check, X, MessageSquare, GitBranch, Inbox, Send, Clock4 } from 'lucide-react';
import { Card, CardHead, Btn, Chip, Avatar, Tabs, EmptyState, toast } from '../components/ui';
import { useApp, activeStartup } from '../lib/store';
import { fmtL, timeAgo } from '../lib/format';
import type { Connection, OppStage } from '../lib/types';

const OPP_STAGES: { id: OppStage; label: string }[] = [
  { id: 'intro', label: 'Intro' }, { id: 'diligence', label: 'Diligence' }, { id: 'term-sheet', label: 'Term sheet' }, { id: 'funded', label: 'Funded' },
];

export default function Connections() {
  const { db, user, respondConnection, setConnStage } = useApp();
  const isFounder = user?.role === 'founder';
  const ownSt = activeStartup(db, user);
  const meInv = db.investors.find(i => i.userId === user?.id);
  const mine = db.connections.filter(c => isFounder ? c.startupId === ownSt?.id : c.investorId === meInv?.id);
  const [tab, setTab] = useState('inbox');

  const inbox = mine.filter(c => c.status === 'pending' && c.fromRole !== user?.role);
  const sent = mine.filter(c => c.status === 'pending' && c.fromRole === user?.role);
  const active = mine.filter(c => c.status === 'accepted');

  const other = (c: Connection) => isFounder
    ? { name: db.investors.find(i => i.id === c.investorId)?.name ?? '?', org: db.investors.find(i => i.id === c.investorId)?.firm ?? '', hue: db.investors.find(i => i.id === c.investorId)?.hue ?? 200, link: `/app/investor/${c.investorId}` }
    : { name: db.startups.find(s => s.id === c.startupId)?.founder.name ?? '?', org: db.startups.find(s => s.id === c.startupId)?.name ?? '', hue: db.startups.find(s => s.id === c.startupId)?.hue ?? 30, link: `/app/startup/${c.startupId}` };

  const shown = tab === 'inbox' ? inbox : tab === 'sent' ? sent : active;

  return (
    <div className="mx-auto max-w-[980px]">
      <div className="mb-6">
        <h1 className="flex items-center gap-2.5 text-[24px] font-bold tracking-tight text-white sm:text-[27px]">
          <span className="a-soft flex h-10 w-10 items-center justify-center rounded-xl"><Compass size={18} /></span>
          {isFounder ? 'Connections' : 'Opportunities'}
        </h1>
        <p className="mt-1.5 text-[13px] text-white/45">{isFounder ? 'Consent first — private rooms open only after you accept.' : 'Review founder requests, then move accepted deals across your pipeline.'}</p>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <Tabs active={tab} onChange={setTab} tabs={[
          { id: 'inbox', label: <span className="flex items-center gap-1.5"><Inbox size={13} /> Inbox{inbox.length ? ` (${inbox.length})` : ''}</span> },
          { id: 'sent', label: <span className="flex items-center gap-1.5"><Send size={13} /> Sent</span> },
          { id: 'active', label: <span className="flex items-center gap-1.5"><GitBranch size={13} /> Active ({active.length})</span> },
        ]} />
      </div>

      <AnimatePresence mode="popLayout">
        {shown.length === 0 ? (
          <Card><EmptyState icon={<Clock4 size={18} />} title={tab === 'inbox' ? 'Inbox is clear' : tab === 'sent' ? 'No requests in flight' : 'No active opportunities'} sub={tab === 'active' ? 'Accepted connections become trackable opportunities with a private room and stage history.' : 'High-signal matches land here — keep your profile fresh to stay ranked.'} action={<Link to="/app/matching"><Btn size="sm" variant="outline">Open AI matching</Btn></Link>} /></Card>
        ) : (
          <div className="space-y-3.5">
            {shown.map((c, i) => {
              const o = other(c);
              const th = db.threads.find(t => t.connId === c.id);
              return (
                <motion.div key={c.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="p-5">
                    <div className="flex flex-wrap items-start gap-4">
                      <Link to={o.link}><Avatar name={o.name} hue={o.hue} size={46} online={c.status === 'accepted'} /></Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={o.link} className="text-[15px] font-semibold text-white hover:underline">{o.name}</Link>
                          <span className="text-[12px] text-white/40">{o.org}</span>
                          <span className="ml-auto font-mono text-[10.5px] text-white/30">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 rounded-lg bg-white/[.04] px-3.5 py-2.5 text-[12.5px] italic leading-relaxed text-white/62">“{c.message}”</p>
                      </div>
                    </div>

                    {tab !== 'active' ? (
                      <div className="mt-4 flex flex-wrap justify-end gap-2">
                        {tab === 'inbox' ? (
                          <>
                            <Btn size="sm" variant="ghost" onClick={() => { respondConnection(c.id, false); toast('Declined — the other side sees a polite close'); }}><X size={14} /> Decline</Btn>
                            <Btn size="sm" onClick={() => { respondConnection(c.id, true); toast('Accepted — encrypted room opened'); }}><Check size={14} /> Accept & open room</Btn>
                          </>
                        ) : <Chip tone="gold"><Clock4 size={12} /> Awaiting response</Chip>}
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[.06] pt-4">
                        <span className="mr-1 text-[10.5px] uppercase tracking-wider text-white/35">Opportunity stage</span>
                        <div className="flex flex-wrap gap-1.5">
                          {OPP_STAGES.map(s => (
                            <button key={s.id} onClick={() => { setConnStage(c.id, s.id); toast(`Moved to ${s.label}`); }} aria-pressed={c.stage === s.id}
                              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${c.stage === s.id ? 'a-soft' : 'border-white/10 text-white/45 hover:border-white/25 hover:text-white/80'}`}>
                              {s.label}
                            </button>
                          ))}
                        </div>
                        <div className="ml-auto flex gap-2">
                          {th && <Link to={`/app/messages/${th.id}`}><Btn size="sm" variant="outline"><MessageSquare size={13} /> Open room</Btn></Link>}
                          <Link to="/app/tracker"><Btn size="sm" variant="ghost"><GitBranch size={13} /> Tracker</Btn></Link>
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
