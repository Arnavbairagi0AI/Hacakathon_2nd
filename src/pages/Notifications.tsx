import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sparkles, MessageSquare, GitBranch, ShieldCheck, CheckCheck, Inbox, Zap } from 'lucide-react';
import { Card, Btn, Chip, Tabs, EmptyState } from '../components/ui';
import { useApp } from '../lib/store';
import { timeAgo, DAY } from '../lib/format';
import type { Notice } from '../lib/types';

const ICONS: Record<Notice['type'], ReactNode> = {
  match: <Sparkles size={15} className="text-gold-300" />,
  connect: <Zap size={15} className="text-iris-300" />,
  message: <MessageSquare size={15} className="text-emerald-300" />,
  milestone: <GitBranch size={15} className="text-amber-300" />,
  system: <Inbox size={15} className="text-white/50" />,
  security: <ShieldCheck size={15} className="text-rose-300" />,
};

export default function Notifications() {
  const { db, user, markRead } = useApp();
  const nav = useNavigate();
  const role = user?.role === 'investor' ? 'investor' : 'founder';
  const list = role === 'founder' ? db.noticesF : db.noticesI;
  const [tab, setTab] = useState('all');
  const shown = tab === 'unread' ? list.filter(n => !n.read) : list;
  const today = shown.filter(n => Date.now() - n.ts < DAY);
  const earlier = shown.filter(n => Date.now() - n.ts >= DAY);

  const Row = ({ n, i }: { n: Notice; i: number }) => (
    <motion.button key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
      onClick={() => { markRead(role, n.id); nav(n.link); }}
      className={`group flex w-full items-start gap-4 border-b border-white/[.05] px-5 py-4 text-left transition hover:bg-white/[.03] ${!n.read ? 'bg-white/[.018]' : ''}`}>
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${n.read ? 'border-white/[.08] bg-white/[.03]' : 'a-soft'}`}>{ICONS[n.type]}</span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[13.5px] font-semibold text-white/90">{n.title}</span>
          {!n.read && <span className="a-dot h-1.5 w-1.5 rounded-full" />}
          <Chip className="!px-2 !py-0 !text-[9.5px] uppercase tracking-wider">{n.type}</Chip>
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-relaxed text-white/50">{n.body}</span>
      </span>
      <span className="shrink-0 font-mono text-[10.5px] text-white/30">{timeAgo(n.ts)}</span>
    </motion.button>
  );

  return (
    <div className="mx-auto max-w-[820px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-[24px] font-bold tracking-tight text-white sm:text-[27px]">
            <span className="a-soft flex h-10 w-10 items-center justify-center rounded-xl"><Bell size={18} /></span>
            Notification centre
          </h1>
          <p className="mt-1.5 text-[13px] text-white/45">{list.filter(n => !n.read).length} unread · batched to protect deep work</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs active={tab} onChange={setTab} tabs={[{ id: 'all', label: 'All' }, { id: 'unread', label: 'Unread' }]} />
          <Btn variant="outline" size="sm" onClick={() => markRead(role)}><CheckCheck size={14} /> Mark all read</Btn>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {shown.length === 0 ? (
          <Card><EmptyState icon={<Bell size={18} />} title="All caught up" sub="New match alerts, room activity and security events will land here." /></Card>
        ) : (
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {today.length > 0 && (
              <>
                <div className="mb-2 px-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/30">Today</div>
                <Card className="mb-5 overflow-hidden">{today.map((n, i) => <Row key={n.id} n={n} i={i} />)}</Card>
              </>
            )}
            {earlier.length > 0 && (
              <>
                <div className="mb-2 px-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/30">Earlier</div>
                <Card className="overflow-hidden">{earlier.map((n, i) => <Row key={n.id} n={n} i={i} />)}</Card>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="mt-5 flex items-start gap-3 border-emerald-400/15 p-4">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-400" />
        <p className="text-[12px] leading-relaxed text-white/50">Security events (sign-ins, deck access grants, admin actions) are always delivered here and recorded in the immutable audit log — even if emails are muted.</p>
      </Card>
    </div>
  );
}
