import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Paperclip, SmilePlus, ShieldCheck, FileText, Lock, LockOpen, CheckCheck, Search, Video, Phone } from 'lucide-react';
import { Avatar, Chip, Btn, EmptyState, toast, Tip } from '../components/ui';
import { useApp } from '../lib/store';
import { fmtTime, fmtDay } from '../lib/format';
import type { Msg, Thread } from '../lib/types';

const QUICK = ['👍', '🙏', '🎉', '🔥', '👀'];

function otherOf(t: Thread, myId?: string) {
  return t.pair.find(p => p.userId !== myId) ?? t.pair[1];
}
function meOf(t: Thread, myId?: string) {
  return t.pair.find(p => p.userId === myId) ?? t.pair[0];
}

export default function Messages() {
  const { db, user, sendMsg, reactMsg, setTyping, toggleDeckShare } = useApp();
  const { threadId } = useParams();
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [emojiFor, setEmojiFor] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<number | null>(null);

  const threads = useMemo(() => db.threads.filter(t => t.pair.some(p => p.userId === user?.id)), [db.threads, user]);
  const active = useMemo(() => threads.find(t => t.id === threadId) ?? threads[0], [threads, threadId]);
  const other = active ? otherOf(active, user?.id) : null;
  const me = active ? meOf(active, user?.id) : null;

  const conn = db.connections.find(c => c.id === active?.connId);
  const startup = db.startups.find(s => s.id === conn?.startupId);
  const investor = db.investors.find(i => i.id === conn?.investorId);
  const iAmFounderOwner = user?.role === 'founder' && startup?.ownerId === user.id;
  const deckShared = !!(startup?.deck && investor && startup.deck.sharedWith.includes(investor.id));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [active?.msgs.length, active?.typing, active?.id]);

  // Stop advertising typing when leaving the room.
  useEffect(() => () => {
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    if (active) setTyping(active.id, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  const noteTyping = () => {
    if (!active) return;
    setTyping(active.id, true);
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => setTyping(active.id, false), 2500);
  };

  const send = async () => {
    if (!active || !draft.trim()) return;
    const txt = draft.trim();
    setDraft('');
    const r = await sendMsg(active.id, txt);
    if ('err' in r) { toast(r.err, 'warn'); return; }
    setTyping(active.id, false);
  };

  return (
    <div className="mx-auto max-w-[1240px]">
      <div className="glass overflow-hidden rounded-2xl">
        <div className="grid md:grid-cols-[300px_1fr]" style={{ height: 'calc(100vh - 168px)', minHeight: 560 }}>
          {/* --------------------------- room list --------------------------- */}
          <aside className={`flex-col border-r border-white/[.06] bg-ink-900/55 ${active && threadId ? 'hidden md:flex' : 'flex'}`}>
            <div className="border-b border-white/[.06] p-4">
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-white"><MessageSquare size={16} className="a-text" /> Private rooms</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/40"><ShieldCheck size={11} className="text-emerald-400" /> Opened only after mutual acceptance</p>
              <div className="relative mt-3">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search rooms…" aria-label="Search conversations"
                  className="w-full rounded-lg border border-white/10 bg-white/[.04] py-2 pl-8 pr-3 text-[12.5px] outline-none transition focus:border-white/25" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {threads.filter(t => otherOf(t, user?.id).name.toLowerCase().includes(q.toLowerCase())).map(t => {
                const o = otherOf(t, user?.id);
                const last = t.msgs[t.msgs.length - 1];
                const isActive = active?.id === t.id;
                return (
                  <Link key={t.id} to={`/app/messages/${t.id}`}
                    className={`flex items-start gap-3 rounded-xl px-3 py-3 transition ${isActive ? 'bg-white/[.07]' : 'hover:bg-white/[.04]'}`}>
                    <Avatar name={o.name} hue={o.hue} size={40} online={o.online} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[13.5px] font-semibold text-white/92">{o.name}</span>
                        {last && <span className="shrink-0 font-mono text-[9.5px] text-white/30">{fmtTime(last.ts)}</span>}
                      </span>
                      <span className="block truncate text-[11px] text-white/38">{o.org}</span>
                      {last && <span className="mt-1 flex items-center gap-1 truncate text-[12px] text-white/50">{last.senderId === user?.id && <CheckCheck size={12} className="shrink-0 text-iris-300" />}{last.file ? <span className="flex items-center gap-1"><FileText size={11} /> {last.file.name}</span> : last.text}</span>}
                    </span>
                  </Link>
                );
              })}
              {threads.length === 0 && (
                <div className="px-3 py-8 text-center">
                  <EmptyState icon={<Lock size={16} />} title="No open rooms" sub="Rooms unlock automatically when a connection request is accepted."
                    action={<Link to="/app/matching"><Btn size="sm">Find matches</Btn></Link>} />
                </div>
              )}
            </div>
          </aside>

          {/* --------------------------- chat pane --------------------------- */}
          {active && other ? (
            <section className="flex min-w-0 flex-col">
              {/* header */}
              <div className="flex flex-wrap items-center gap-3 border-b border-white/[.06] px-5 py-3">
                <Avatar name={other.name} hue={other.hue} size={38} online={other.online} />
                <div className="min-w-0">
                  <Link to={user?.role === 'founder' ? `/app/investor/${investor?.id}` : `/app/startup/${startup?.id}`} className="text-[14px] font-semibold text-white hover:underline">{other.name}</Link>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                    {active.typing ? `${other.name.split(' ')[0]} is typing…` : (other.online ? '● online' : '○ away')} <span className="text-white/25">·</span> <span className="text-white/40">{other.org}</span>
                  </div>
                </div>
                {conn && <Chip tone="iris" className="capitalize">{conn.stage.replace('-', ' ')}</Chip>}
                <div className="ml-auto flex items-center gap-1.5">
                  {startup?.deck && (
                    <Tip wide label={iAmFounderOwner
                      ? deckShared ? 'Deck access granted to this counterparty. Watermarked + revocable any time.' : 'Deck access is locked. Grant to let them open the watermarked preview inside this room.'
                      : deckShared ? 'The founder has granted you watermarked deck access.' : 'Ask the founder to grant deck access — it opens inside this room with watermarking.'}>
                      <button
                        onClick={async () => {
                          if (!iAmFounderOwner || !investor || !startup) { if (!iAmFounderOwner) toast('Only the founder controls deck sharing', 'warn'); return; }
                          await toggleDeckShare(startup.id, investor.id);
                          toast(deckShared ? 'Deck access revoked' : 'Deck access granted — watermarked');
                        }}
                        className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition ${deckShared ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300' : 'border-white/12 text-white/55 hover:border-white/30 hover:text-white'}`}>
                        {deckShared ? <LockOpen size={12} /> : <Lock size={12} />} Deck {deckShared ? 'shared' : 'locked'}
                      </button>
                    </Tip>
                  )}
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/50 transition hover:text-white" aria-label="Voice call" onClick={() => toast('Voice calls are not part of this build yet')}><Phone size={13} /></button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/50 transition hover:text-white" aria-label="Video call" onClick={() => toast('Video calls are not part of this build yet')}><Video size={13} /></button>
                </div>
              </div>

              {/* messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5" aria-live="polite">
                {active.msgs.map((m, i) => (
                  <Bubble key={m.id} m={m} prev={active.msgs[i - 1]} isMe={m.senderId === user?.id} isSystem={m.senderId === 'system'}
                    author={(m.senderId === user?.id ? me : other) ?? undefined} emojiFor={emojiFor} setEmojiFor={setEmojiFor}
                    onReact={em => reactMsg(active.id, m.id, em)} />
                ))}
              </div>

              {/* composer */}
              <div className="border-t border-white/[.06] p-3.5">
                <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-2 transition focus-within:border-white/25">
                  <button onClick={() => fileRef.current?.click()} aria-label="Attach file"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[.07] hover:text-white">
                    <Paperclip size={16} />
                  </button>
                  <input ref={fileRef} type="file" className="hidden" onChange={async e => {
                    const f = e.target.files?.[0];
                    if (f && active) {
                      toast('Uploading file…');
                      const r = await sendMsg(active.id, undefined, f);
                      if ('err' in r) toast(r.err, 'warn');
                      else toast('File shared — rules-protected in this room');
                    }
                    e.target.value = '';
                  }} />
                  <textarea value={draft} onChange={e => { setDraft(e.target.value); noteTyping(); }} rows={1}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
                    placeholder={`Message ${other.name.split(' ')[0]}… (Enter to send)`} aria-label="Message"
                    className="max-h-32 w-full resize-none bg-transparent py-1.5 text-[13.5px] leading-relaxed text-white/90 placeholder:text-white/30 outline-none" />
                  <div className="flex shrink-0 items-center gap-0.5">
                    {QUICK.slice(0, 2).map(e => <button key={e} className="rounded p-1.5 text-[14px] transition hover:scale-125 hover:bg-white/[.07]" onClick={() => setDraft(d => d + e)} aria-label={`Insert ${e}`}>{e}</button>)}
                    <button onClick={() => void send()} disabled={!draft.trim()} aria-label="Send message"
                      className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg transition enabled:hover:brightness-110 disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, rgb(var(--acc2)), rgb(var(--acc)))' }}>
                      <Send size={14} className="text-ink-950" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 flex items-center gap-1.5 px-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/25"><ShieldCheck size={10} /> audited · role-locked · access controlled by Firestore rules</p>
              </div>
            </section>
          ) : (
            <section className="hidden flex-1 items-center justify-center md:flex">
              <EmptyState icon={<MessageSquare size={18} />} title="Select a room" sub="Your private deal rooms appear here after mutual acceptance." />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Bubble({ m, prev, isMe, isSystem, author, emojiFor, setEmojiFor, onReact }: {
  m: Msg; prev?: Msg; isMe: boolean; isSystem: boolean; author?: { name: string; hue: number };
  emojiFor: string | null; setEmojiFor: (v: string | null) => void; onReact: (e: string) => void;
}) {
  const newDay = !prev || new Date(prev.ts).toDateString() !== new Date(m.ts).toDateString();
  if (isSystem) {
    return (
      <div className="my-4 flex justify-center">
        <span className="flex max-w-md items-center gap-2 rounded-full border border-white/[.08] bg-white/[.03] px-4 py-1.5 text-center text-[11px] text-white/45"><ShieldCheck size={11} className="shrink-0 text-emerald-400" />{m.text}</span>
      </div>
    );
  }
  return (
    <>
      {newDay && (
        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/[.06]" />
          <span className="rounded-full border border-white/[.08] px-3 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
            {new Date(m.ts).toDateString() === new Date().toDateString() ? 'Today' : fmtDay(m.ts)}
          </span>
          <span className="h-px flex-1 bg-white/[.06]" />
        </div>
      )}
      <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.25 }}
        className={`group relative mb-2 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex max-w-[78%] items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
          {!isMe && <span className="mb-0.5 shrink-0"><Avatar name={author?.name ?? '?'} hue={author?.hue ?? 200} size={24} /></span>}
          <div className="min-w-0">
            <div className={`relative rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed shadow-md ${isMe
              ? 'rounded-br-md text-white'
              : 'rounded-bl-md border border-white/[.08] bg-white/[.05] text-white/88'}`}
              style={isMe ? { background: 'linear-gradient(135deg, rgb(var(--acc) / .32), rgb(var(--acc) / .17))', border: '1px solid rgb(var(--acc) / .3)' } : {}}>
              {m.text}
              {m.file && (
                <div className={`mt-1 flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${isMe ? 'border-white/20 bg-black/20' : 'border-white/10 bg-white/[.05]'}`}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-500/20 text-gold-300"><FileText size={16} /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-semibold">{m.file.name}</span>
                    <span className="block font-mono text-[10px] opacity-60">{m.file.sizeKB} KB · shared inside this room</span>
                  </span>
                </div>
              )}
              <span className={`mt-1 flex items-center gap-1 font-mono text-[9px] ${isMe ? 'justify-end text-white/50' : 'text-white/35'}`}>
                {fmtTime(m.ts)} {isMe && <CheckCheck size={11} />}
              </span>
              {/* hover reaction bar */}
              <div className={`absolute -top-4 z-20 hidden gap-0.5 rounded-full border border-white/12 bg-ink-850 px-1 py-0.5 shadow-xl group-hover:flex ${isMe ? 'left-2' : 'right-2'}`}>
                {QUICK.map(e => <button key={e} onClick={() => onReact(e)} className="rounded-full px-1 text-[13px] transition hover:scale-125" aria-label={`React ${e}`}>{e}</button>)}
                <div className="relative">
                  <button onClick={() => setEmojiFor(emojiFor === m.id ? null : m.id)} className="rounded-full px-1 text-white/45 hover:text-white" aria-label="More"><SmilePlus size={13} /></button>
                  <AnimatePresence>{emojiFor === m.id && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="glass-deep absolute -top-9 right-0 flex rounded-full p-1">
                      {['👏', '💡', '🤞', '❤️'].map(e => <button key={e} onClick={() => { onReact(e); setEmojiFor(null); }} className="rounded-full px-1.5 py-0.5 text-[14px] transition hover:scale-125">{e}</button>)}
                    </motion.div>
                  )}</AnimatePresence>
                </div>
              </div>
            </div>
            {Object.keys(m.reactions).length > 0 && (
              <div className={`mt-1 flex flex-wrap gap-1 ${isMe ? 'justify-end' : ''}`}>
                {Object.entries(m.reactions).map(([e, n]) => (
                  <button key={e} onClick={() => onReact(e)} className="a-soft flex items-center gap-1 rounded-full px-2 py-px text-[11px] transition hover:scale-110">{e}<span className="font-mono text-[9.5px]">{n}</span></button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
