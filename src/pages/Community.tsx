import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Volume2, MicOff, Mic, PhoneOff, ShieldCheck, Send, SmilePlus, Lock, Flame, Headphones } from 'lucide-react';
import { Avatar, Chip, toast, EmptyState } from '../components/ui';
import { useApp } from '../lib/store';
import { fmtTime } from '../lib/format';
import type { Channel, ChannelMsg } from '../lib/types';

const EMOJIS = ['👍', '🔥', '🎉', '💯', '🤝', '🚀'];

export default function Community() {
  const { db, user, postChannelMsg, reactChannelMsg, clearChannelUnread, voiceIn, joinVoice, leaveVoice } = useApp();
  const role: 'founder' | 'investor' = user?.role === 'investor' ? 'investor' : 'founder';
  const channels = role === 'founder' ? db.fChannels : db.iChannels;
  const text = channels.filter(c => c.kind === 'text');
  const voice = channels.filter(c => c.kind === 'voice');
  const [activeId, setActiveId] = useState(text[0]?.id ?? '');
  const active = channels.find(c => c.id === activeId) ?? text[0] ?? voice[0];
  const [draft, setDraft] = useState('');
  const [emojiFor, setEmojiFor] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active) clearChannelUnread(role, active.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [active?.msgs?.length, activeId]);

  const members = Array.from(new Set((active?.msgs ?? []).map(m => m.author))).slice(0, 9);
  const serverName = role === 'founder' ? 'Founders Circle' : 'LP & GP Syndicate';
  const since = role === 'founder' ? 'founder-only · verified' : 'investor-only · verified';

  if (channels.length === 0) {
    return (
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-4">
          <h1 className="flex items-center gap-2.5 text-[22px] font-bold tracking-tight text-white sm:text-[25px]">
            <span className="a-soft flex h-10 w-10 items-center justify-center rounded-xl"><Headphones size={18} /></span>
            {serverName}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-[12px] text-white/45"><Lock size={12} className="text-emerald-400" /> Strictly {since} — enforced by Firestore rules</p>
        </div>
        <EmptyState icon={<Headphones size={18} />} title="Channels are being set up"
          sub="Role-scoped text and voice channels are created by the platform team in Firestore — say hello once they land." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1240px]">
      {/* header strip */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-[22px] font-bold tracking-tight text-white sm:text-[25px]">
            <span className="a-soft flex h-10 w-10 items-center justify-center rounded-xl"><Headphones size={18} /></span>
            {serverName}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-[12px] text-white/45">
            <Lock size={12} className="text-emerald-400" /> Strictly {since} — cross-role access is blocked at the database level
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Chip tone="jade"><ShieldCheck size={12} /> Role-gated</Chip>
          <Chip>{members.length + (voiceIn ? 1 : 0)} online here</Chip>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="grid lg:grid-cols-[240px_1fr] xl:grid-cols-[240px_1fr_210px]" style={{ height: 'calc(100vh - 210px)', minHeight: 540 }}>
          {/* ------------------------- channel rail ------------------------- */}
          <aside className="hidden flex-col border-r border-white/[.06] bg-ink-900/55 lg:flex">
            <div className="border-b border-white/[.06] px-4 py-3.5">
              <div className="text-[13.5px] font-bold text-white">{serverName}</div>
              <div className="mt-0.5 text-[10.5px] uppercase tracking-[0.14em] text-white/32">{since}</div>
            </div>
            <div className="flex-1 overflow-y-auto px-2.5 py-3">
              <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">Text channels</div>
              <div className="space-y-0.5">
                {text.map(c => (
                  <button key={c.id} onClick={() => setActiveId(c.id)} aria-current={active?.id === c.id}
                    className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition ${active?.id === c.id ? 'bg-white/[.08] text-white' : 'text-white/52 hover:bg-white/[.045] hover:text-white/85'}`}>
                    <Hash size={14} className={active?.id === c.id ? 'a-text' : 'text-white/30'} />
                    <span className="truncate">{c.name}</span>
                    {!!c.unread && <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 font-mono text-[9.5px] font-bold text-white">{c.unread}</span>}
                  </button>
                ))}
              </div>
              <div className="mt-5 px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">Voice lounges</div>
              <div className="space-y-0.5">
                {voice.map(c => {
                  const joined = voiceIn === c.id;
                  return (
                    <div key={c.id} className="rounded-lg px-1 py-1 transition hover:bg-white/[.035]">
                      <div className="flex items-center gap-2 px-1.5 py-1 text-[13px] font-medium text-white/60">
                        <Volume2 size={14} className="text-emerald-400/80" />
                        <span className="truncate">{c.name}</span>
                        {joined
                          ? <button onClick={() => leaveVoice(c.id)} className="ml-auto flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/15 text-rose-300 transition hover:bg-rose-500/30" aria-label="Leave voice"><PhoneOff size={12} /></button>
                          : <button onClick={() => joinVoice(c.id)} className="a-soft ml-auto rounded-md px-2 py-0.5 text-[10px] font-semibold">JOIN</button>}
                      </div>
                      <div className="ml-7 space-y-1.5 pb-1 pt-1">
                        {c.voiceMembers?.map(v => (
                          <div key={v.name} className="flex items-center gap-2">
                            <Avatar name={v.name} hue={v.hue} size={20} />
                            <span className="text-[11.5px] text-white/55">{v.name}</span>
                          </div>
                        ))}
                        {joined && (
                          <div className="flex items-center gap-2">
                            <span className="rounded-full ring-2 ring-emerald-400/70"><Avatar name={user?.name ?? 'You'} hue={user?.hue ?? 36} size={20} /></span>
                            <span className="text-[11.5px] font-medium text-emerald-300">You · in lounge</span>
                            <button onClick={() => setMuted(m => !m)} className="ml-auto text-white/40 transition hover:text-white" aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <MicOff size={12} /> : <Mic size={12} />}</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2.5 border-t border-white/[.06] bg-ink-900/70 px-3 py-2.5">
              <Avatar name={user?.name ?? 'You'} hue={user?.hue ?? 36} size={30} online />
              <div className="min-w-0 flex-1"><div className="truncate text-[12px] font-semibold text-white/90">{user?.name}</div><div className="text-[10px] capitalize text-emerald-300">online · {role}</div></div>
            </div>
          </aside>

          {/* ------------------------- chat pane ------------------------- */}
          <section className="flex min-w-0 flex-col">
            {active?.kind === 'text' ? (
              <>
                <div className="flex items-center gap-3 border-b border-white/[.06] px-5 py-3">
                  <Hash size={17} className="a-text" />
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-white">{active.name}</div>
                    <div className="truncate text-[11.5px] text-white/40">{active.desc}</div>
                  </div>
                </div>

                <div ref={scrollRef} className="flex-1 space-y-0.5 overflow-y-auto px-4 py-4" aria-live="polite">
                  {(active.msgs ?? []).map((m, i) => {
                    const prev = (active.msgs ?? [])[i - 1];
                    const grouped = prev && prev.author === m.author && m.ts - prev.ts < 5 * 60_000;
                    return (
                      <ChannelRow key={m.id} m={m} grouped={grouped} me={user?.name ?? ''}
                        emojiFor={emojiFor} setEmojiFor={setEmojiFor}
                        onReact={em => reactChannelMsg(role, active.id, m.id, em)} />
                    );
                  })}
                </div>

                <div className="border-t border-white/[.06] p-3">
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3.5 transition focus-within:border-white/25">
                    <span className="a-text text-[16px] font-bold">+</span>
                    <input value={draft} onChange={e => setDraft(e.target.value)}
                      onKeyDown={async e => { if (e.key === 'Enter' && draft.trim()) { const r = await postChannelMsg(role, active.id, draft); if ('err' in r) toast(r.err, 'warn'); setDraft(''); } }}
                      placeholder={`Message #${active.name}`} aria-label={`Message ${active.name}`}
                      className="w-full bg-transparent py-3 text-[13.5px] text-white/90 placeholder:text-white/30 outline-none" />
                    <div className="flex items-center gap-1 text-white/35">
                      {EMOJIS.slice(0, 3).map(e => <button key={e} className="rounded p-1 text-[14px] transition hover:scale-125 hover:bg-white/[.07]" onClick={() => setDraft(d => d + e)} aria-label={`Insert ${e}`}>{e}</button>)}
                      <button onClick={async () => { if (draft.trim()) { const r = await postChannelMsg(role, active.id, draft); if ('err' in r) toast(r.err, 'warn'); setDraft(''); } }} aria-label="Send"
                        className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg transition hover:brightness-110" style={{ background: 'linear-gradient(135deg, rgb(var(--acc2)), rgb(var(--acc)))' }}>
                        <Send size={13} className="text-ink-950" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="a-soft flex h-14 w-14 items-center justify-center rounded-2xl"><Volume2 size={22} /></span>
                <h3 className="text-[16px] font-semibold text-white">{active?.name}</h3>
                <p className="text-[12.5px] text-white/45">Select a text channel to chat — or join a lounge from the sidebar. Presence is live; audio isn't part of this build yet.</p>
              </div>
            )}
          </section>

          {/* ------------------------- members ------------------------- */}
          <aside className="hidden border-l border-white/[.06] bg-ink-900/55 px-4 py-4 xl:block">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">Active here — {members.length + (voiceIn ? 1 : 0)}</div>
            <div className="mt-3 space-y-2.5">
              {(active?.msgs ?? []).filter((m, i, a) => a.findIndex(x => x.author === m.author) === i).slice(0, 9).map(m => (
                <div key={m.author} className="flex items-center gap-2.5">
                  <Avatar name={m.author} hue={m.hue} size={28} online />
                  <div className="min-w-0"><div className="truncate text-[12.5px] font-medium text-white/80">{m.author}</div><div className="truncate text-[10.5px] text-white/35">{m.roleTag}</div></div>
                </div>
              ))}
              <div className="flex items-center gap-2.5">
                <Avatar name={user?.name ?? 'You'} hue={user?.hue ?? 36} size={28} online />
                <div className="min-w-0"><div className="truncate text-[12.5px] font-medium text-white/80">{user?.name} <span className="text-white/30">(you)</span></div><div className="truncate text-[10.5px] text-white/35">{user?.company ?? user?.role}</div></div>
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/[.06] p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300"><Flame size={12} /> Community pulse</div>
              <p className="mt-1 text-[11px] leading-snug text-white/50">{channels.reduce((a, c) => a + (c.unread ?? 0), 0)} unread across {text.length} text channels · {voice.filter(v => (v.voiceMembers?.length ?? 0) > 0).length} lounges occupied.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ChannelRow({ m, grouped, me, emojiFor, setEmojiFor, onReact }: {
  m: ChannelMsg; grouped: boolean; me: string; emojiFor: string | null; setEmojiFor: (v: string | null) => void; onReact: (e: string) => void;
}) {
  const isMe = m.author === me;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`group relative flex gap-3 rounded-lg px-2 py-1.5 transition hover:bg-white/[.028] ${grouped ? 'mt-0' : 'mt-3'}`}>
      {!grouped ? <Avatar name={m.author} hue={m.hue} size={34} /> : <span className="w-[34px] shrink-0 text-right font-mono text-[9.5px] leading-[34px] text-white/0 transition group-hover:text-white/30">{fmtTime(m.ts)}</span>}
      <div className="min-w-0 flex-1">
        {!grouped && (
          <div className="flex flex-wrap items-baseline gap-2">
            <span className={`text-[13px] font-semibold ${isMe ? 'a-text' : 'text-white/90'}`}>{m.author}</span>
            <span className="rounded bg-white/[.06] px-1.5 py-px text-[9.5px] font-medium uppercase tracking-wide text-white/38">{m.roleTag}</span>
            <span className="font-mono text-[9.5px] text-white/28">{fmtTime(m.ts)}</span>
          </div>
        )}
        {m.reply && <div className="mt-1 border-l-2 border-[rgb(var(--acc)/.5)] pl-2.5 text-[11px] italic text-white/38">↩ {m.reply}</div>}
        <p className="mt-0.5 text-[13.5px] leading-relaxed text-white/78">{m.text}</p>
        {Object.keys(m.reactions).length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {Object.entries(m.reactions).map(([e, n]) => (
              <button key={e} onClick={() => onReact(e)} className="a-soft flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] transition hover:scale-105">
                {e}<span className="font-mono text-[10px]">{n}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {/* hover actions */}
      <div className="absolute -top-3 right-3 hidden gap-0.5 rounded-lg border border-white/12 bg-ink-850 p-0.5 shadow-xl group-hover:flex">
        {EMOJIS.slice(0, 4).map(e => (
          <button key={e} onClick={() => onReact(e)} className="rounded px-1.5 py-1 text-[13px] transition hover:scale-125 hover:bg-white/[.08]" aria-label={`React ${e}`}>{e}</button>
        ))}
        <div className="relative">
          <button onClick={() => setEmojiFor(emojiFor === m.id ? null : m.id)} className="rounded px-1.5 py-1 text-white/40 transition hover:bg-white/[.08] hover:text-white" aria-label="More reactions"><SmilePlus size={14} /></button>
          <AnimatePresence>
            {emojiFor === m.id && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="glass-deep absolute -top-10 right-0 z-20 flex gap-0.5 rounded-lg p-1">
                {EMOJIS.map(e => <button key={e} onClick={() => { onReact(e); setEmojiFor(null); }} className="rounded px-1.5 py-1 text-[14px] transition hover:scale-125 hover:bg-white/[.08]">{e}</button>)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
