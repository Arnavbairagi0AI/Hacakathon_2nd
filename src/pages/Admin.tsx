import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, AlertOctagon, ScrollText, Search, Ban, CheckCircle2, KeyRound, Inbox } from 'lucide-react';
import { Card, CardHead, Chip, Btn, Avatar, Tabs, Input, toast } from '../components/ui';
import { useApp } from '../lib/store';
import { timeAgo, DAY } from '../lib/format';

export default function Admin() {
  const { db, user, setUserStatus, resolveFlag } = useApp();
  const [q, setQ] = useState('');
  const [roleF, setRoleF] = useState<'all' | 'founder' | 'investor' | 'admin'>('all');

  const users = useMemo(() => db.users.filter(u =>
    (roleF === 'all' || u.role === roleF) &&
    ((u.name ?? '').toLowerCase().includes(q.toLowerCase()) || (u.email ?? '').toLowerCase().includes(q.toLowerCase()))), [db.users, q, roleF]);

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/app/dashboard" replace />;

  const openFlags = db.flags.filter(f => f.status === 'open');
  const founders = db.users.filter(u => u.role === 'founder').length;
  const investors = db.users.filter(u => u.role === 'investor').length;
  const logins24h = db.audits.filter(a => a.action.startsWith('SESSION_LOGIN') && Date.now() - a.ts < DAY).length;
  const logins7d = db.audits.filter(a => a.action.startsWith('SESSION_LOGIN') && Date.now() - a.ts < 7 * DAY).length;

  return (
    <div className="mx-auto max-w-[1150px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-[24px] font-bold tracking-tight text-white sm:text-[27px]">
            <span className="a-soft flex h-10 w-10 items-center justify-center rounded-xl"><ShieldCheck size={18} /></span>
            Admin Console
          </h1>
          <p className="mt-1.5 text-[13px] text-white/45">Trust & Safety · user management · moderation · audit trail (rules-enforced)</p>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { l: 'Total users', v: db.users.length, s: 'Live accounts', icon: <Users size={15} /> },
          { l: 'Founders / Investors', v: `${founders} / ${investors}`, s: 'By users-doc role', icon: <CheckCircle2 size={15} /> },
          { l: 'Open flags', v: openFlags.length, s: 'Moderation queue', icon: <AlertOctagon size={15} /> },
          { l: 'Sign-ins · 24h / 7d', v: `${logins24h} / ${logins7d}`, s: 'From audit log', icon: <KeyRound size={15} /> },
        ].map((s, i) => (
          <motion.div key={s.l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card hover className="p-5">
              <div className="a-soft flex h-9 w-9 items-center justify-center rounded-xl">{s.icon}</div>
              <div className="mt-3 text-[24px] font-bold text-white">{s.v}</div>
              <div className="text-[12px] text-white/45">{s.l}</div>
              <div className="mt-0.5 text-[10.5px] text-white/30">{s.s}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHead title="Recent audit activity" sub="Live from the audits collection — sign-ins, connections, deck access, admin actions" />
          <div className="max-h-[320px] overflow-auto font-mono text-[11.5px]">
            {db.audits.length === 0 && (
              <p className="flex items-center gap-2 px-5 py-10 text-center text-[12.5px] text-white/40">
                <Inbox size={14} /> No audit events yet — they start recording the first time a user signs in or acts.
              </p>
            )}
            {db.audits.slice(0, 40).map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="flex flex-wrap items-center gap-x-4 border-b border-white/[.035] px-5 py-2.5 hover:bg-white/[.02]">
                <span className="text-white/30">{new Date(a.ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-gold-300/90">{a.action}</span>
                <span className="text-white/55">{a.actor}</span>
                <span className="ml-auto text-white/35">{a.target}</span>
                <span className="text-white/25">{a.ip}</span>
              </motion.div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHead title="Moderation queue" sub={`${openFlags.length} open`} />
          <div className="max-h-[320px] space-y-3 overflow-auto p-4">
            {openFlags.length === 0 && <p className="py-6 text-center text-[12.5px] text-white/40">Queue clear. Nice. 🎉</p>}
            {openFlags.map(f => (
              <div key={f.id} className="rounded-xl border border-rose-400/20 bg-rose-400/[.05] p-3.5">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-rose-300"><AlertOctagon size={12} /> {f.reason}</div>
                <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-white/60">{f.content}</p>
                <div className="mt-1 text-[10.5px] text-white/35">{f.author} · {timeAgo(f.ts)}</div>
                <div className="mt-2.5 flex gap-2">
                  <Btn size="sm" variant="outline" className="!py-1 !text-[11px]" onClick={() => { resolveFlag(f.id); toast('Flag resolved — content stands'); }}>Dismiss</Btn>
                  <Btn size="sm" variant="danger" className="!py-1 !text-[11px]" onClick={() => { resolveFlag(f.id); toast('Flag resolved — follow-up in the audit log'); }}>Resolve</Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* users */}
      <Card className="mt-5">
        <CardHead
          title="User management"
          sub="Role-based authorization enforced by Firestore rules below"
          right={
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" className="!w-44 !py-2 !pl-8 !text-[12px]" />
              </div>
              <Tabs active={roleF} onChange={v => setRoleF(v as typeof roleF)} tabs={[{ id: 'all', label: 'All' }, { id: 'founder', label: 'Founders' }, { id: 'investor', label: 'Investors' }, { id: 'admin', label: 'Admins' }]} />
            </div>
          } />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-white/[.07] text-[10.5px] uppercase tracking-[0.14em] text-white/32">
                <th className="px-5 py-3 font-semibold">User</th><th className="px-4 py-3 font-semibold">Role</th><th className="px-4 py-3 font-semibold">Security</th><th className="px-4 py-3 font-semibold">Joined</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-white/[.045] transition hover:bg-white/[.025]">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} hue={u.hue} size={32} />
                      <div><div className="text-[13px] font-semibold text-white/90">{u.name || 'Unnamed'}</div><div className="text-[11px] text-white/38">{u.email}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><Chip tone={u.role === 'founder' ? 'gold' : u.role === 'investor' ? 'iris' : 'rose'} className="capitalize">{u.role}</Chip></td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1.5">
                      {u.verified && <Chip tone="jade" className="!text-[9.5px]">verified</Chip>}
                      {u.mfa ? <Chip tone="acc" className="!text-[9.5px]">MFA</Chip> : <Chip className="!text-[9.5px]">no MFA</Chip>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11.5px] text-white/45">{u.createdAt ? timeAgo(u.createdAt) : '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${u.status === 'active' ? 'text-emerald-300' : 'text-rose-300'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />{u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={async () => {
                        if (u.id === user.id) { toast('You cannot suspend yourself', 'warn'); return; }
                        await setUserStatus(u.id, u.status === 'active' ? 'suspended' : 'active');
                        toast(u.status === 'active' ? `${u.name || u.email} suspended` : `${u.name || u.email} reinstated`, u.status === 'active' ? 'warn' : 'ok');
                      }}
                      className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${u.status === 'active' ? 'border-rose-400/25 text-rose-300 hover:bg-rose-400/10' : 'border-emerald-400/25 text-emerald-300 hover:bg-emerald-400/10'}`}>
                      {u.status === 'active' ? <span className="flex items-center gap-1"><Ban size={11} /> Suspend</span> : 'Reinstate'}
                    </button>
                  </td>
                </motion.tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-[12.5px] text-white/40">No users match this filter yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mb-4 mt-6 flex items-center gap-2 px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/25"><ShieldCheck size={11} /> Reads/writes enforced server-side by Firestore Security Rules · audits are append-only from authenticated clients</p>
    </div>
  );
}
