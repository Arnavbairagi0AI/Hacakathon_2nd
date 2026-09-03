/* ==================================================================== */
/* VentureSetu store — REAL data layer over Firebase (Spark plan).       */
/*                                                                       */
/* Every collection below maps 1:1 to the Firestore schema documented    */
/* in docs/FIREBASE.md and enforced by firestore.rules. The in-memory    */
/* `db` object is only a live projection of Firestore onSnapshot        */
/* listeners — there is no seed, no demo fallback, no localStorage.      */
/* ==================================================================== */
import {
  createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import {
  onAuthStateChanged, signOut as fbSignOut, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, reload,
  getIdToken,
} from 'firebase/auth';
import {
  collection, doc, onSnapshot, query, where, orderBy, limit,
  addDoc, setDoc, updateDoc, deleteDoc, writeBatch, getDoc,
  arrayUnion, arrayRemove,
  Query as FbQuery, DocumentReference as FbDocRef,
  type Unsubscribe, type DocumentSnapshot,
} from 'firebase/firestore';
import { ref as stRef, uploadBytes, deleteObject, getBlob } from 'firebase/storage';
import type {
  User, Startup, Investor, Connection, Thread, Msg, Channel, ChannelMsg, Notice,
  Track, VEvent, Scheme, News, Faq, Audit, Flag, Role, Deck, MsgFile, MarketProgram,
} from './types';
import { initFirebase, fbAuth, fbDb, fbStorage, safeFileName, MAX_DECK_MB } from './firebase';
import { MIN, HOUR, DAY } from './format';

/* ------------------------------------------------------------- types */
export interface PendingReg { email: string; name: string; role: 'founder' | 'investor' }
export interface MfaChallenge { userId: string; email: string }
export interface ResetChallenge { email: string }

type Party0 = { userId: string; name: string; org: string; hue: number; online: boolean };
interface ThreadMeta { id: string; connId: string; pair?: Party0[]; typingBy?: Record<string, number>; createdAt?: number }
interface ChannelMeta { id: string; role: 'founder' | 'investor'; kind: 'text' | 'voice'; name: string; desc?: string; order?: number }
interface VoiceMember { id: string; name: string; hue: number; joinedAt?: number; muted?: boolean }
interface EventLive extends VEvent { rsvpCount: number; mine: boolean; left: number }

export interface DB {
  users: User[]; startups: Startup[]; investors: Investor[];
  connections: Connection[]; threads: Thread[];
  fChannels: Channel[]; iChannels: Channel[];
  noticesF: Notice[]; noticesI: Notice[];
  tracks: Track[]; rsvps: string[];
  events: EventLive[]; schemes: Scheme[]; news: News[]; faqs: Faq[]; market: MarketProgram[];
  audits: Audit[]; flags: Flag[];
}

interface AppCtx {
  ready: boolean;
  /** True once the signed-in view's live listeners have delivered first data. */
  hydrated: boolean;
  bootError: string | null;
  db: DB;
  user: User | null;
  /** Firebase Auth account (uid/email/emailVerified). */
  fbUser: { uid: string; email: string; emailVerified: boolean } | null;
  pendingReg: PendingReg | null;
  mfaChallenge: MfaChallenge | null;
  resetChallenge: ResetChallenge | null;
  // auth
  signup: (name: string, email: string, pass: string, role: Role, mfa: boolean) => Promise<{ ok: string } | { err: string }>;
  verifyEmail: (email: string, code?: string) => Promise<{ ok: string } | { err: string }>;
  resendVerification: () => Promise<{ ok: string } | { err: string }>;
  login: (email: string, pass: string) => Promise<{ ok: 'session' | 'mfa' } | { err: string }>;
  verifyMfa: (code: string) => Promise<{ ok: string } | { err: string }>;
  forgot: (email: string) => Promise<{ ok: string } | { err: string }>;
  resetPass: (email: string, code: string, next: string) => Promise<{ ok: string } | { err: string }>;
  logout: () => Promise<void>;
  completeOnboarding: (patch: Partial<User>, startup?: Partial<Startup>, investorPatch?: Partial<Investor>) => Promise<string | undefined>;
  createStartup: (min: { name: string; sector: string; stage: string; askL: number }) => Promise<string | null>;
  setFocusStartup: (startupId: string) => Promise<void>;
  // data
  sendConnection: (targetId: string, message: string) => Promise<{ ok: string } | { err: string }>;
  respondConnection: (connId: string, accept: boolean) => Promise<{ ok: string } | { err: string }>;
  setConnStage: (connId: string, stage: Connection['stage']) => Promise<void>;
  sendMsg: (threadId: string, text?: string, file?: File) => Promise<{ ok: string } | { err: string }>;
  setTyping: (threadId: string, on: boolean) => void;
  reactMsg: (threadId: string, msgId: string, emoji: string) => Promise<void>;
  postChannelMsg: (role: 'founder' | 'investor', channelId: string, text: string) => Promise<{ ok: string } | { err: string }>;
  reactChannelMsg: (role: 'founder' | 'investor', channelId: string, msgId: string, emoji: string) => Promise<void>;
  clearChannelUnread: (role: 'founder' | 'investor', channelId: string) => void;
  voiceIn: string | null;
  joinVoice: (channelId: string) => Promise<void>;
  leaveVoice: (channelId: string) => Promise<void>;
  markRead: (role: 'founder' | 'investor', id?: string) => Promise<void>;
  pushNotice: (n: Omit<Notice, 'id' | 'ts' | 'read'>, role?: 'founder' | 'investor') => Promise<void>;
  rsvp: (eventId: string) => Promise<void>;
  progressLesson: (trackId: string) => Promise<void>;
  updateStartup: (id: string, patch: Partial<Startup>) => Promise<void>;
  toggleDeckShare: (startupId: string, investorId: string) => Promise<void>;
  attachDeck: (startupId: string, file: File) => Promise<{ ok: string } | { err: string }>;
  removeDeck: (startupId: string) => Promise<void>;
  /** Rules-gated deck fetch. Returns a blob URL or null on denial/error. */
  deckBlobUrl: (deck: Deck) => Promise<string | null>;
  bumpMilestone: (startupId: string, msId: string) => Promise<void>;
  setUserStatus: (userId: string, status: User['status']) => Promise<void>;
  resolveFlag: (flagId: string) => Promise<void>;
  createFlag: (target: { type: string; id: string }, reason: string, content: string) => Promise<void>;
  audit: (action: string, target: string) => Promise<void>;
}

const Ctx = createContext<AppCtx | null>(null);
export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside provider');
  return v;
};

/* ------------------------------------------------------------ helpers */
const randId = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
const nowMs = () => Date.now();

/* The Firebase SDK exposes DocumentSnapshot.exists as a method in some
 * builds and as a boolean property in others (across package versions the
 * optimizer can pull different copies into one page). Accept both. */
type AnySnap = DocumentSnapshot & { exists?: boolean | (() => boolean) };
function snapExists(s: AnySnap): boolean {
  return typeof s.exists === 'function' ? s.exists() : !!s.exists;
}
function asDoc<T>(snap: AnySnap): (T & { id: string }) | null {
  if (!snapExists(snap)) return null;
  return { ...(snap.data() as object), id: snap.id } as T & { id: string };
}
function asList<T>(snap: { docs: AnySnap[] }): (T & { id: string })[] {
  return snap.docs.filter(d => snapExists(d)).map(d => ({ ...(d.data() as object), id: d.id }) as T & { id: string });
}

function errOf(e: unknown, fallback: string): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/permission-denied|Missing or insufficient permissions/i.test(msg)) return 'You don\u2019t have access to do that.';
  if (/invalid-credential|wrong-password/i.test(msg)) return 'Incorrect email or password.';
  if (/user-not-found/i.test(msg)) return 'No account found for this email.';
  if (/email-already-in-use/i.test(msg)) return 'An account with this email already exists — try signing in.';
  if (/invalid-email/i.test(msg)) return 'That email address doesn\u2019t look valid.';
  if (/weak-password/i.test(msg)) return 'Password is too weak — use at least 6 characters.';
  if (/too-many-requests/i.test(msg)) return 'Too many attempts — wait a minute and try again.';
  if (/network-request-failed/i.test(msg)) return 'Network error — check your connection.';
  return msg || fallback;
}

/* -------------------------------------------------- snapshot wrappers */
function useSub<T>(build: () => FbQuery | FbDocRef | null, deps: unknown[]): {
  docs: (T & { id: string })[]; loaded: boolean;
} {
  const [docs, setDocs] = useState<(T & { id: string })[]>([]);
  const [loaded, setLoaded] = useState(false);
  const buildRef = useRef(build);
  useEffect(() => { buildRef.current = build; }, [build]);
  useEffect(() => {
    setLoaded(false);
    setDocs([]);
    const q = buildRef.current();
    if (!q) { setLoaded(true); return; }
    // Discriminate Query vs DocumentReference reliably. The installed SDK's
    // Query class has NO `where` member (queries are built functionally), so
    // the old `'where' in q` test was always false: every collection snapshot
    // was routed through the doc branch, snapExists() returned false on the
    // QuerySnapshot, and real data was silently dropped as an empty list.
    // Note: collection() returns a CollectionReference, which EXTENDS Query
    // and carries an `.id` — so test with instanceof, never by `.id`.
    const onErr = (e: unknown) => { console.error('[vs-sub-err]', (e as Error)?.message); setLoaded(true); };
    const un = q instanceof FbQuery
      ? onSnapshot(q as FbQuery, s => { setDocs(asList<T>(s)); setLoaded(true); }, onErr)
      : onSnapshot(q as FbDocRef, s => { setDocs(asDoc<T>(s) ? [asDoc<T>(s) as T & { id: string }] : []); setLoaded(true); }, onErr);
    return un;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { docs, loaded };
}

/* ============================================================ provider */
export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AppCtx['fbUser']>(null);
  const [pendingReg, setPendingReg] = useState<PendingReg | null>(null);
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null);
  const [resetChallenge, setResetChallenge] = useState<ResetChallenge | null>(null);

  // No `booted` guard here: main.tsx uses <StrictMode>, which double-invokes
  // effects in dev (mount -> cleanup -> mount). A guard made the second run
  // skip subscribing, so no auth listener survived, `ready` never flipped and
  // every signed-in route hung on the splash forever. The effect is naturally
  // idempotent: initFirebase() self-guards and the returned unsubscribe runs
  // on cleanup.
  useEffect(() => {
    if (!initFirebase()) {
      setBootError('Firebase is not configured. Copy .env.example to .env with your project\u2019s web-app config and reload.');
      setReady(true);
      return;
    }
    const un = onAuthStateChanged(fbAuth(), async u => {
      if (u) {
        try { await reload(u); } catch { /* offline token refresh ok */ }
        setAuthUser({ uid: u.uid, email: u.email ?? '', emailVerified: u.emailVerified });
      } else setAuthUser(null);
      setReady(true);
    });
    return un;
  }, []);

  const canRun = ready && !bootError;
  const myUid = authUser?.uid ?? null;

  /* ---- my users doc (identity + role live from Firestore) ---------- */
  const meSub = useSub<User>(() => (myUid && canRun ? doc(dbx(), 'users', myUid) : null), [myUid, canRun]);
  const meRaw = meSub.docs[0] ?? null;
  const meLoaded = meSub.loaded;
  const role = meRaw?.role ?? null;

  const user = useMemo(() => (meRaw && meRaw.status === 'active' ? { ...meRaw } : null), [meRaw]);

  /* ---- live profile collections (public listing surfaces) ---------- */
  // Listings require an authenticated, active member (rules) — attach only
  // once auth restored, or an anonymous early attach gets denied and the
  // listener never recovers (deps unchanged => no re-subscribe).
  const stSub = useSub<Startup>(() => (canRun && myUid ? query(collection(dbx(), 'startups'), orderBy('createdAt', 'desc'), limit(400)) : null), [canRun, myUid]);
  const invSub = useSub<Investor>(() => (canRun && myUid ? query(collection(dbx(), 'investors'), limit(400)) : null), [canRun, myUid]);
  const startups = useMemo(() => [...stSub.docs].sort((a, b) => a.name.localeCompare(b.name)), [stSub.docs]);
  const investors = useMemo(() => [...invSub.docs].sort((a, b) => a.name.localeCompare(b.name)), [invSub.docs]);

  /* ---- content (editorial — live Firestore, may legitimately be empty) */
  // Single /content collection partitioned by the `section` field (docs in
  // docs/FIREBASE.md). Firestore paths must alternate coll/doc, so a
  // content/<kind>/<id> nesting is impossible — content/{id} is the shape.
  const evSub = useSub<VEvent>(() => (canRun ? query(collection(dbx(), 'content'), where('section', '==', 'events')) : null), [canRun]);
  const trSub = useSub<Track>(() => (canRun ? query(collection(dbx(), 'content'), where('section', '==', 'tracks')) : null), [canRun]);
  const scSub = useSub<Scheme>(() => (canRun ? query(collection(dbx(), 'content'), where('section', '==', 'schemes')) : null), [canRun]);
  const nwSub = useSub<News>(() => (canRun ? query(collection(dbx(), 'content'), where('section', '==', 'news')) : null), [canRun]);
  const fqSub = useSub<Faq>(() => (canRun ? query(collection(dbx(), 'content'), where('section', '==', 'faqs')) : null), [canRun]);
  const mkSub = useSub<MarketProgram>(() => (canRun ? query(collection(dbx(), 'content'), where('section', '==', 'market')) : null), [canRun]);

  /* ---- my subcollections ------------------------------------------- */
  const noticesSub = useSub<Notice>(() => (myUid && canRun ? query(collection(dbx(), 'users', myUid, 'notices'), orderBy('ts', 'desc'), limit(60)) : null), [myUid, canRun]);
  const rsvpSub = useSub<{ bookedAt: number }>(() => (myUid && canRun ? collection(dbx(), 'users', myUid, 'rsvps') : null), [myUid, canRun]);
  const progressSub = useSub<Record<string, number>>(() => (myUid && canRun ? doc(dbx(), 'users', myUid, 'progress', 'tracks') : null), [myUid, canRun]);
  const readSub = useSub<{ lastRead: number }>(() => (myUid && canRun ? collection(dbx(), 'users', myUid, 'channelReads') : null), [myUid, canRun]);

  /* ---- connections (participant-scoped) ----------------------------- */
  const myStartupIds = useMemo(() => (myUid ? startups.filter(s => s.ownerId === myUid).map(s => s.id) : []), [startups, myUid]);
  const myInvId = useMemo(() => (myUid && investors.some(i => i.id === myUid) ? myUid : null), [investors, myUid]);

  const connKey = `${myUid}|${role}|${myStartupIds.join(',')}|${myInvId ?? ''}`;
  const connSub = useSub<Connection>(() => {
    if (!canRun || !myUid) return null;
    if (role === 'investor') return query(collection(dbx(), 'connections'), where('investorId', '==', myUid), orderBy('createdAt', 'desc'), limit(200));
    if (role === 'founder' && myStartupIds.length > 0)
      return myStartupIds.length === 1
        ? query(collection(dbx(), 'connections'), where('startupId', '==', myStartupIds[0]), orderBy('createdAt', 'desc'), limit(200))
        : query(collection(dbx(), 'connections'), where('startupId', 'in', myStartupIds.slice(0, 10)), orderBy('createdAt', 'desc'), limit(200));
    return null; // founder with no startups yet — nothing to query
  }, [canRun, connKey]);
  const connections = useMemo(() => connSub.docs as Connection[], [connSub.docs]);

  /* ---- threads + their messages ------------------------------------- */
  const threadSub = useSub<ThreadMeta>(() => {
    if (!canRun || !myUid) return null;
    if (role === 'admin') return query(collection(dbx(), 'threads'), limit(100));
    return query(collection(dbx(), 'threads'), where('pairIds', 'array-contains', myUid), limit(100));
  }, [canRun, myUid, role]);
  const threadsMeta = threadSub.docs;

  const [msgsByThread, setMsgsByThread] = useState<Record<string, Msg[]>>({});
  const [threadLoaded, setThreadLoaded] = useState(false);
  const threadIdsKey = threadsMeta.map(t => t.id).join('|');
  useEffect(() => {
    setMsgsByThread({});
    setThreadLoaded(false);
    if (!threadsMeta.length) { setThreadLoaded(true); return; }
    const subs: Unsubscribe[] = [];
    let done = 0;
    threadsMeta.forEach(t => {
      const q = query(collection(dbx(), 'threads', t.id, 'msgs'), orderBy('ts', 'asc'), limit(500));
      subs.push(onSnapshot(q, s => {
        const list = asList<Msg>(s).sort((a, b) => a.ts - b.ts);
        setMsgsByThread(m => ({ ...m, [t.id]: list }));
        done += 1;
        if (done === threadsMeta.length) setThreadLoaded(true);
      }, () => { done += 1; if (done === threadsMeta.length) setThreadLoaded(true); }));
    });
    return () => subs.forEach(u => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadIdsKey, canRun]);

  const threadMap = useMemo<Record<string, Thread>>(() => {
    const map: Record<string, Thread> = {};
    for (const t of threadsMeta) {
      const msgs = msgsByThread[t.id] ?? [];
      const p = (t.pair ?? []).slice(0, 2) as Party0[];
      const a = p[0] ?? { userId: '?', name: 'Unknown', org: '', hue: 200, online: false };
      const b = p[1] ?? { userId: '?', name: 'Unknown', org: '', hue: 200, online: false };
      const other = (myUid && a.userId === myUid ? b : a);
      const typingTs = t.typingBy?.[other.userId] ?? 0;
      map[t.id] = {
        id: t.id, connId: t.connId,
        pair: [a, b],
        typing: !!typingTs && nowMs() - typingTs < 6000,
        deckShared: false,
        msgs,
      };
    }
    return map;
  }, [threadsMeta, msgsByThread, myUid]);

  /* ---- community channels (role-scoped) + messages + voice ---------- */
  const chSub = useSub<ChannelMeta>(() => {
    if (!canRun || !role || role === 'admin') return null;
    return query(collection(dbx(), 'channels'), where('role', '==', role));
  }, [canRun, role]);
  const channelsMeta = chSub.docs;

  const [chanMsgs, setChanMsgs] = useState<Record<string, ChannelMsg[]>>({});
  const [voiceMap, setVoiceMap] = useState<Record<string, VoiceMember[]>>({});
  const channelKey = channelsMeta.map(c => c.id).join('|');
  useEffect(() => {
    setChanMsgs({});
    setVoiceMap({});
    if (!channelsMeta.length) return;
    const subs: Unsubscribe[] = [];
    channelsMeta.forEach(c => {
      const mq = query(collection(dbx(), 'channels', c.id, 'msgs'), orderBy('ts', 'asc'), limit(300));
      subs.push(onSnapshot(mq, s => setChanMsgs(m => ({ ...m, [c.id]: asList<ChannelMsg>(s).sort((x, y) => x.ts - y.ts) })), () => {}));
      const vq = collection(dbx(), 'channels', c.id, 'voice');
      subs.push(onSnapshot(vq, s => setVoiceMap(m => ({ ...m, [c.id]: asList<VoiceMember>(s) })), () => {}));
    });
    return () => subs.forEach(u => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelKey, canRun]);

  const fChannels = useMemo(() => (role === 'founder' ? assembleChannels(channelsMeta, chanMsgs, voiceMap, readSub.docs, myUid) : []), [channelsMeta, chanMsgs, voiceMap, readSub.docs, role, myUid]);
  const iChannels = useMemo(() => (role === 'investor' ? assembleChannels(channelsMeta, chanMsgs, voiceMap, readSub.docs, myUid) : []), [channelsMeta, chanMsgs, voiceMap, readSub.docs, role, myUid]);

  /* ---- admin-only views --------------------------------------------- */
  const isAdminNow = role === 'admin';
  const usersSub = useSub<User>(() => (isAdminNow && canRun ? collection(dbx(), 'users') : null), [isAdminNow, canRun]);
  const auditsSub = useSub<Audit>(() => (isAdminNow && canRun ? query(collection(dbx(), 'audits'), orderBy('ts', 'desc'), limit(300)) : null), [isAdminNow, canRun]);
  const flagsSub = useSub<Flag>(() => (isAdminNow && canRun ? collection(dbx(), 'flags') : null), [isAdminNow, canRun]);

  /* ---- assembled db (live projection only) -------------------------- */
  const db: DB = useMemo(() => {

    const progress = progressSub.docs[0] ?? {};
    const tracks: Track[] = trSub.docs.map(t => ({ ...t, done: Math.min(progress[t.id] ?? 0, t.lessons ?? 0) }));
    const events: EventLive[] = evSub.docs.map(e => {
      const count = e.rsvpCount ?? 0;
      const seats = e.seats ?? 0;
      const mine = rsvpSub.docs.some(r => r.id === e.id);
      return { ...e, rsvpCount: count, mine, left: Math.max(0, seats - count) };
    }).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
    const news = [...nwSub.docs].sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
    const myNotices = noticesSub.docs as Notice[];
    return {
      users: isAdminNow ? usersSub.docs as User[] : (meRaw ? [meRaw] : []),
      startups, investors, connections,
      threads: Object.values(threadMap).sort((a, b) => (b.msgs[b.msgs.length - 1]?.ts ?? 0) - (a.msgs[a.msgs.length - 1]?.ts ?? 0)),
      fChannels, iChannels,
      noticesF: myNotices, noticesI: myNotices,
      tracks, rsvps: rsvpSub.docs.map(r => r.id),
      events, schemes: scSub.docs as Scheme[], news, faqs: fqSub.docs as Faq[], market: mkSub.docs as MarketProgram[],
      audits: auditsSub.docs as Audit[], flags: flagsSub.docs as Flag[],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stSub.docs, invSub.docs, connSub.docs, threadMap, fChannels, iChannels, noticesSub.docs, rsvpSub.docs, progressSub.docs,
    evSub.docs, trSub.docs, scSub.docs, nwSub.docs, fqSub.docs, mkSub.docs, usersSub.docs, auditsSub.docs, flagsSub.docs, isAdminNow, meRaw]);

  /* ---- hydration: listeners that matter to the current view -------- */
  const hydrated = useMemo(() => {
    if (!ready) return false;
    if (!authUser) return true; // signed-out public content needs no splash
    if (!meLoaded) return false;
    if (!meRaw) return false;
    const base = stSub.loaded && invSub.loaded && threadSub.loaded;
    if (role === 'founder') return base && connSub.loaded && threadLoaded;
    if (role === 'investor') return base && connSub.loaded && threadLoaded;
    return base; // admin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authUser, meLoaded, meRaw, role, stSub.loaded, invSub.loaded, threadSub.loaded, connSub.loaded, threadLoaded]);

  const meEmail = user?.email ?? authUser?.email ?? '';

  /* ------------------------------------------------- auth actions ---- */
  const audit = async (action: string, target: string) => {
    try {
      // Actor comes from the live session (render-time state can lag right
      // after sign-in; the rules require actor == token email).
      const actor = fbAuth().currentUser?.email ?? meEmail;
      await addDoc(collection(dbx(), 'audits'), { ts: nowMs(), actor, action, target, ip: '(web)' });
    } catch (e) { console.warn('audit skipped', e); }
  };

  async function createUserDoc(uid: string, name: string, roleIn: Role): Promise<boolean> {
    try {
      // Read identity from the Firebase session at call time — right after a
      // sign-in the React `authUser` state may not have propagated yet, and a
      // stale empty email would make the rules deny the create (email must
      // equal the token email) and break account recovery mid-login.
      const cu = fbAuth().currentUser;
      const d = dbx();
      const ref = doc(d, 'users', uid);
      const existing = await getDoc(ref);
      if (snapExists(existing)) return true;
      await setDoc(ref, {
        id: uid, name, email: cu?.email ?? authUser?.email ?? '', role: roleIn,
        verified: cu?.emailVerified ?? authUser?.emailVerified ?? false, mfa: false, status: 'active',
        hue: roleIn === 'founder' ? 36 : 232, createdAt: nowMs(), onboarded: false,
      });
      return true;
    } catch (e) { console.error('user doc create failed', e); return false; }
  }

  const signup: AppCtx['signup'] = async (name, email, pass, roleIn, mfa) => {
    const em = email.trim().toLowerCase();
    if (!name.trim()) return { err: 'Please enter your full name.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) return { err: 'That email address doesn\u2019t look valid.' };
    if (pass.length < 8) return { err: 'Password must be at least 8 characters.' };
    if (roleIn !== 'founder' && roleIn !== 'investor') return { err: 'Choose founder or investor.' };
    if (mfa) return { err: 'TOTP MFA needs the optional Identity Platform upgrade. It\u2019s kept OFF so your project never leaves the free tier — see docs/FIREBASE.md to enable later.' };
    try {
      await createUserWithEmailAndPassword(fbAuth(), em, pass);
      setPendingReg({ email: em, name: name.trim(), role: roleIn as 'founder' | 'investor' });
      try {
        await sendEmailVerification(fbAuth().currentUser!);
      } catch {
        return { ok: 'verify' }; // flow continues; resend available on verify step
      }
      return { ok: 'verify' };
    } catch (e) { return { err: errOf(e, 'Signup failed.') }; }
  };

  // Auto-finalise signup as soon as the auth token carries emailVerified.
  useEffect(() => {
    if (!authUser || !pendingReg || !authUser.emailVerified) return;
    (async () => {
      if (await createUserDoc(authUser.uid, pendingReg.name, pendingReg.role)) setPendingReg(null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, pendingReg]);

  const verifyEmail: AppCtx['verifyEmail'] = async (_email, _code) => {
    const u = fbAuth().currentUser;
    if (!u) return { err: 'No signup session — start again from /signup.' };
    try { await reload(u); } catch { /* offline */ }
    // Force a fresh ID token: the rules require request.auth.token.email_verified,
    // and the token minted at signup still carries email_verified:false until a
    // refresh — reload() alone updates the user object, not the token claims.
    try { await getIdToken(u, true); } catch { /* offline */ }
    const pr = pendingReg;
    if (!u.emailVerified) return { err: 'Not verified yet — click the link we emailed you, then press Continue.' };
    const ok = await createUserDoc(u.uid, pr?.name ?? 'User', pr?.role ?? 'founder');
    if (!ok) return { err: 'Could not create your profile — try again.' };
    setPendingReg(null);
    return { ok: 'verified' };
  };

  const resendVerification: AppCtx['resendVerification'] = async () => {
    const u = fbAuth().currentUser;
    if (!u) return { err: 'No pending signup session.' };
    try { await sendEmailVerification(u); return { ok: 'sent' }; } catch (e) { return { err: errOf(e, 'Could not resend.') }; }
  };

  const login: AppCtx['login'] = async (email, pass) => {
    const em = email.trim().toLowerCase();
    try {
      const cred = await signInWithEmailAndPassword(fbAuth(), em, pass);
      try { await reload(cred.user); } catch { /* ok */ }
      const d = dbx();
      const snap = await getDoc(doc(d, 'users', cred.user.uid));
      if (snapExists(snap) && (snap.data() as User).status === 'suspended') {
        await fbSignOut(fbAuth());
        return { err: 'This account is suspended. Contact VentureSetu Trust & Safety.' };
      }
      if (!snapExists(snap)) {
        // Verified user whose profile doc is missing (pre-onboarding crash / import).
        if (!cred.user.emailVerified) {
          await fbSignOut(fbAuth());
          return { err: 'Verify your email first — check your inbox for the link we sent at signup.' };
        }
        await createUserDoc(cred.user.uid, '', 'founder');
      }
      await audit('SESSION_LOGIN', 'self');
      return { ok: 'session' };
    } catch (e) { return { err: errOf(e, 'Sign-in failed.') }; }
  };

  const verifyMfa: AppCtx['verifyMfa'] = async () => ({ err: 'MFA is not enabled on this free-tier project. Sign in without a code.' });

  const forgot: AppCtx['forgot'] = async (email) => {
    const em = email.trim().toLowerCase();
    try {
      await sendPasswordResetEmail(fbAuth(), em);
      setResetChallenge({ email: em });
      return { ok: em };
    } catch {
      // Firebase hides whether an account exists; always show the safe message.
      return { err: 'If an account exists for this email, a reset link is on its way — check inbox and spam.' };
    }
  };

  const resetPass: AppCtx['resetPass'] = async () => ({ err: 'Open the reset link Firebase emailed you to choose a new password, then sign in.' });

  const logout: AppCtx['logout'] = async () => {
    setPendingReg(null); setMfaChallenge(null);
    try { await fbSignOut(fbAuth()); } catch { /* ok */ }
  };

  /* ------------------------------------------------- data actions ---- */
  const completeOnboarding: AppCtx['completeOnboarding'] = async (patch, startupPatch, investorPatch) => {
    const uid = myUid; const cur = meRaw;
    if (!uid || !cur) return undefined;
    if (!authUser?.emailVerified) return undefined;
    const d = dbx();
    const batch = writeBatch(d);
    const clean = { ...patch } as Partial<User>;
    delete clean.id; delete clean.email; delete clean.role; delete clean.status; delete clean.createdAt;
    batch.update(doc(d, 'users', uid), { ...clean, name: patch.name ?? cur.name, onboarded: true });
    let newId: string | undefined;

    if (cur.role === 'founder' && startupPatch) {
      const owned = startups.filter(s => s.ownerId === uid);
      const target = (cur.focusStartupId && owned.find(s => s.id === cur.focusStartupId)) || owned[0];
      if (target) {
        batch.update(doc(d, 'startups', target.id), { ...startupPatch, ownerId: uid });
        newId = target.id;
      } else {
        const sid = randId('st');
        const base: Startup = {
          id: sid, ownerId: uid, createdAt: nowMs(),
          name: startupPatch.name ?? 'My Startup', tagline: startupPatch.tagline ?? '',
          sector: startupPatch.sector ?? 'SaaS', stage: startupPatch.stage ?? 'Seed',
          location: startupPatch.location ?? 'Bengaluru', founded: startupPatch.founded ?? new Date().getFullYear(),
          team: startupPatch.team ?? 3, pitch: startupPatch.pitch ?? '', problem: startupPatch.problem ?? '',
          solution: startupPatch.solution ?? '', market: startupPatch.market ?? '', model: startupPatch.model ?? '',
          founder: startupPatch.founder ?? { name: cur.name, title: patch.title ?? 'Founder', bio: '', qualifications: [], experience: [] },
          askL: startupPatch.askL ?? 100, equityPct: startupPatch.equityPct ?? 10, raisedL: startupPatch.raisedL ?? 0,
          cashL: startupPatch.cashL ?? 50, burnL: startupPatch.burnL ?? 5,
          revenueL: startupPatch.revenueL ?? 0, prevRevenueL: startupPatch.prevRevenueL ?? 0,
          revSeries: startupPatch.revSeries ?? [1, 1.2, 1.4, 1.5],
          burnSeries: startupPatch.burnSeries ?? [4, 4.4, 4.8, 5],
          months: startupPatch.months ?? ['Nov', 'Dec', 'Jan', 'Feb'],
          growthPct: startupPatch.growthPct ?? 8,
          traction: startupPatch.traction ?? [], highlights: startupPatch.highlights ?? [],
          tags: startupPatch.tags ?? [startupPatch.sector?.toLowerCase() ?? 'saas'],
          milestones: startupPatch.milestones ?? [{ id: randId('ms'), label: 'First milestone', detail: 'Define what done looks like', date: 'This quarter', status: 'active', progress: 10 }],
          readiness: 40, hue: 36,
        };
        batch.set(doc(d, 'startups', sid), base);
        batch.update(doc(d, 'users', uid), { focusStartupId: sid });
        newId = sid;
      }
    }

    if (cur.role === 'investor' && investorPatch) {
      const iid = uid;
      const existingInv = investors.find(i => i.id === iid);
      const invBase: Investor = {
        id: iid, userId: uid, name: cur.name,
        firm: investorPatch.firm ?? 'Independent', title: investorPatch.title ?? 'Investor',
        email: cur.email, phone: investorPatch.phone ?? cur.phone ?? '',
        location: investorPatch.location ?? 'Mumbai', hue: 232,
        bio: investorPatch.bio ?? '', thesis: investorPatch.thesis ?? '',
        sectors: investorPatch.sectors ?? ['SaaS'], stages: investorPatch.stages ?? ['Seed'],
        geos: investorPatch.geos ?? ['Pan-India'],
        chequeMinL: investorPatch.chequeMinL ?? 25, chequeMaxL: investorPatch.chequeMaxL ?? 200,
        qualifications: investorPatch.qualifications ?? [], collaborations: investorPatch.collaborations ?? [],
        portfolio: [], deals: 0, aumCr: 0, response: 80, medCloseDays: 30, verified: false, active: true,
      };
      if (existingInv) batch.update(doc(d, 'investors', iid), { ...invBase, ...investorPatch, userId: uid, id: iid });
      else {
        batch.set(doc(d, 'investors', iid), invBase);
        batch.update(doc(d, 'users', uid), { investorProfileId: iid });
      }
    }
    try {
      await batch.commit();
      await audit('ONBOARDING_COMPLETE', cur.role);
      return newId;
    } catch (e) { console.error('onboarding failed', e); return undefined; }
  };

  const createStartup: AppCtx['createStartup'] = async (min) => {
    const uid = myUid; const cur = meRaw;
    if (!uid || !cur || cur.role !== 'founder') return null;
    const sid = randId('st');
    const nu: Startup = {
      id: sid, ownerId: uid, createdAt: nowMs(), name: min.name, tagline: 'New venture — narrative in progress',
      sector: min.sector, stage: min.stage, location: cur.location ?? 'Bengaluru',
      founded: new Date().getFullYear(), team: 2, pitch: '', problem: '', solution: '', market: '', model: '',
      founder: { name: cur.name, title: cur.title ?? 'Founder', bio: '', qualifications: [], experience: [] },
      askL: min.askL, equityPct: 10, raisedL: 0, cashL: 40, burnL: 4, revenueL: 0, prevRevenueL: 0,
      revSeries: [0.5, 0.8, 1.1, 1.4], burnSeries: [3.4, 3.6, 3.8, 4], months: ['Nov', 'Dec', 'Jan', 'Feb'],
      growthPct: 5, traction: [], highlights: [], tags: [min.sector.toLowerCase()],
      milestones: [
        { id: randId('ms'), label: 'Idea validation', detail: 'Customer discovery sprint', date: 'This quarter', status: 'active', progress: 15 },
        { id: randId('ms'), label: 'First round', detail: 'Target ask set on your profile', amountL: min.askL, date: 'Next 2 quarters', status: 'upcoming', progress: 0 },
      ],
      readiness: 38, hue: 300,
    };
    try {
      const batch = writeBatch(dbx());
      batch.set(doc(dbx(), 'startups', sid), nu);
      batch.update(doc(dbx(), 'users', uid), { focusStartupId: sid });
      await batch.commit();
      await audit('STARTUP_CREATE', min.name);
      return sid;
    } catch (e) { console.error(e); return null; }
  };

  const setFocusStartup: AppCtx['setFocusStartup'] = async (startupId) => {
    if (!myUid) return;
    await updateDoc(doc(dbx(), 'users', myUid), { focusStartupId: startupId }).catch(() => undefined);
  };

  const sendConnection: AppCtx['sendConnection'] = async (targetId, message) => {
    const uid = myUid; const cur = meRaw;
    if (!uid || !cur) return { err: 'Not signed in' };
    if (!authUser?.emailVerified) return { err: 'Verify your email before sending requests.' };
    let startupId = '', investorId = '';
    if (cur.role === 'founder') {
      const own = (cur.focusStartupId && startups.find(s => s.ownerId === uid && s.id === cur.focusStartupId)) || startups.find(s => s.ownerId === uid);
      if (!own) return { err: 'Create a startup profile first.' };
      startupId = own.id; investorId = targetId;
    } else if (cur.role === 'investor') {
      const inv = investors.find(i => i.userId === uid);
      if (!inv) return { err: 'Investor profile not found — finish onboarding first.' };
      startupId = targetId; investorId = inv.id;
    } else return { err: 'Admins cannot send connection requests.' };
    if (connections.some(c => c.startupId === startupId && c.investorId === investorId && c.status !== 'declined'))
      return { err: 'A connection already exists between you two.' };
    try {
      await addDoc(collection(dbx(), 'connections'), {
        startupId, investorId, fromRole: cur.role, message: message.trim(),
        status: 'pending', createdAt: nowMs(), stage: 'intro',
      });
      await audit('CONN_SEND', `${startupId} ↔ ${investorId}`);
      return { ok: 'Request sent — you\u2019ll be notified on acceptance.' };
    } catch (e) { return { err: errOf(e, 'Could not send the request.') }; }
  };

  const noticeFor = async (toUid: string, n: Omit<Notice, 'id' | 'ts' | 'read'>, connId?: string) => {
    if (!myUid) return;
    await addDoc(collection(dbx(), 'users', toUid, 'notices'), {
      type: n.type, title: n.title, body: n.body, link: n.link,
      ts: nowMs(), read: false, by: myUid, to: toUid, ...(connId ? { connId } : {}),
    }).catch(e => console.warn('notice failed', e));
  };

  const respondConnection: AppCtx['respondConnection'] = async (connId, accept) => {
    const uid = myUid; const cur = meRaw;
    const conn = connections.find(c => c.id === connId);
    if (!uid || !cur || !conn) return { err: 'Connection not found' };
    const d = dbx();
    const batch = writeBatch(d);
    let tid: string | undefined;
    batch.update(doc(d, 'connections', connId), { status: accept ? 'accepted' : 'declined' });
    if (accept) {
      const startup = startups.find(s => s.id === conn.startupId);
      const investor = investors.find(i => i.id === conn.investorId);
      const fId = startup?.ownerId ?? '', iId = investor?.id ?? conn.investorId;
      const fName = startup ? { userId: fId, name: startup.founder.name, org: `${startup.name} · Founder`, hue: startup.hue, online: false } : null;
      const iName = investor ? { userId: iId, name: investor.name, org: `${investor.firm} · ${investor.title}`, hue: investor.hue, online: false } : null;
      if (fName && iName) {
        tid = randId('th');
        batch.set(doc(d, 'threads', tid), {
          connId, createdAt: nowMs(), pair: [fName, iName], pairIds: [fId, iId], typingBy: {},
        });
      }
    }
    try {
      await batch.commit();
      await audit(accept ? 'CONN_ACCEPT' : 'CONN_DECLINE', connId);
      if (accept && tid) {
        const startup = startups.find(s => s.id === conn.startupId);
        const investor = investors.find(i => i.id === conn.investorId);
        const recipient = conn.fromRole === 'founder' ? investor?.id : startup?.ownerId;
        if (recipient && recipient !== uid) {
          await noticeFor(recipient, {
            type: 'connect', title: 'Connection accepted — private room open',
            body: `${cur.name} accepted your request.`, link: `/app/messages/${tid}`,
          }, connId).catch(() => undefined);
        }
      }
      return { ok: accept ? 'accepted' : 'declined' };
    } catch (e) { return { err: errOf(e, 'Could not respond.') }; }
  };

  const setConnStage: AppCtx['setConnStage'] = async (connId, stage) => {
    try {
      await updateDoc(doc(dbx(), 'connections', connId), { stage });
      await audit('OPP_STAGE', `${connId} → ${stage}`);
    } catch (e) { console.error(e); }
  };

  const uploadMsgFile = async (threadId: string, msgId: string, file: File): Promise<MsgFile> => {
    const path = `files/threads/${threadId}/${msgId}/${safeFileName(file.name)}`;
    await uploadBytes(stRef(fbStorage(), path), file);
    return { name: file.name, sizeKB: Math.max(1, Math.round(file.size / 1024)), path };
  };

  const sendMsg: AppCtx['sendMsg'] = async (threadId, text, file) => {
    const uid = myUid;
    if (!uid) return { err: 'Not signed in' };
    const t = threadMap[threadId];
    if (!t || !t.pair.some(p => p.userId === uid)) return { err: 'Not a participant of this room.' };
    if (!text?.trim() && !file) return { err: 'Nothing to send' };
    try {
      const mid = randId('m');
      let fileMeta: MsgFile | undefined;
      if (file) {
        if (file.size > MAX_DECK_MB * 1024 * 1024) return { err: `Files are capped at ${MAX_DECK_MB} MB.` };
        fileMeta = await uploadMsgFile(threadId, mid, file);
      }
      await setDoc(doc(dbx(), 'threads', threadId, 'msgs', mid), {
        id: mid, senderId: uid, ts: nowMs(), text: text?.trim() || undefined,
        file: fileMeta, reactions: {},
      });
      await audit('MESSAGE_SEND', threadId);
      return { ok: 'sent' };
    } catch (e) { return { err: errOf(e, 'Message failed to send.') }; }
  };

  const setTyping: AppCtx['setTyping'] = (threadId, on) => {
    const uid = myUid;
    if (!uid || !threadId) return;
    void updateDoc(doc(dbx(), 'threads', threadId), { [`typingBy.${uid}`]: on ? nowMs() : 0 }).catch(() => undefined);
  };

  const reactMsg: AppCtx['reactMsg'] = async (threadId, msgId, emoji) => {
    try {
      const ref = doc(dbx(), 'threads', threadId, 'msgs', msgId);
      const snap = await getDoc(ref);
      if (!snapExists(snap)) return;
      const cur = (snap.data() as Msg).reactions ?? {};
      const next = { ...cur };
      if ((next[emoji] ?? 0) > 0) { next[emoji] -= 1; if (next[emoji] <= 0) delete next[emoji]; }
      else next[emoji] = 1;
      await updateDoc(ref, { reactions: next });
    } catch (e) { console.warn(e); }
  };

  const postChannelMsg: AppCtx['postChannelMsg'] = async (_roleFor, channelId, text) => {
    const uid = myUid; const cur = meRaw;
    if (!uid || !cur || !text.trim()) return { err: 'Nothing to post' };
    try {
      await addDoc(collection(dbx(), 'channels', channelId, 'msgs'), {
        authorId: uid, author: cur.name, hue: cur.hue,
        roleTag: cur.company ? cur.company : (cur.role === 'founder' ? 'Founder' : 'Investor'),
        ts: nowMs(), text: text.trim(), reactions: {},
      });
      return { ok: 'posted' };
    } catch (e) { return { err: errOf(e, 'Could not post.') }; }
  };

  const reactChannelMsg: AppCtx['reactChannelMsg'] = async (_roleFor, channelId, msgId, emoji) => {
    try {
      const ref = doc(dbx(), 'channels', channelId, 'msgs', msgId);
      const snap = await getDoc(ref);
      if (!snapExists(snap)) return;
      const cur = (snap.data() as ChannelMsg).reactions ?? {};
      const next = { ...cur };
      if ((next[emoji] ?? 0) > 0) { next[emoji] -= 1; if (next[emoji] <= 0) delete next[emoji]; }
      else next[emoji] = 1;
      await updateDoc(ref, { reactions: next });
    } catch (e) { console.warn(e); }
  };

  const clearChannelUnread: AppCtx['clearChannelUnread'] = (_roleFor, channelId) => {
    if (!myUid) return;
    void setDoc(doc(dbx(), 'users', myUid, 'channelReads', channelId), { lastRead: nowMs() }, { merge: true }).catch(() => undefined);
  };

  const markRead: AppCtx['markRead'] = async (_roleFor, id) => {
    if (!myUid) return;
    const d = dbx();
    const targets = noticesSub.docs.filter(n => !n.read && (!id || n.id === id));
    await Promise.all(targets.map(n => updateDoc(doc(d, 'users', myUid, 'notices', n.id), { read: true }).catch(() => undefined)));
  };

  const pushNotice: AppCtx['pushNotice'] = async (n, _roleFor) => {
    if (!myUid) return;
    await noticeFor(myUid, n);
  };

  const rsvp: AppCtx['rsvp'] = async (eventId) => {
    if (!myUid) return;
    const d = dbx();
    const myRef = doc(d, 'users', myUid, 'rsvps', eventId);
    const evRef = doc(d, 'content', eventId);
    const has = rsvpSub.docs.some(r => r.id === eventId);
    const ev = evSub.docs.find(e => e.id === eventId);
    const batch = writeBatch(d);
    if (has) {
      batch.delete(myRef);
      batch.update(evRef, { rsvpCount: Math.max(0, (ev?.rsvpCount ?? 1) - 1) });
    } else {
      batch.set(myRef, { bookedAt: nowMs() });
      batch.update(evRef, { rsvpCount: (ev?.rsvpCount ?? 0) + 1 });
    }
    try { await batch.commit(); } catch (e) { console.error('rsvp failed', e); }
  };

  const progressLesson: AppCtx['progressLesson'] = async (trackId) => {
    if (!myUid) return;
    const ref = doc(dbx(), 'users', myUid, 'progress', 'tracks');
    const cur = progressSub.docs[0]?.[trackId] ?? 0;
    await setDoc(ref, { [trackId]: cur + 1 }, { merge: true }).catch(() => undefined);
  };

  const updateStartup: AppCtx['updateStartup'] = async (id, patch) => {
    const clean = { ...patch } as Record<string, unknown>;
    delete clean.id; delete clean.ownerId; delete clean.deck;
    try { await updateDoc(doc(dbx(), 'startups', id), clean); } catch (e) { console.error(e); }
  };

  const toggleDeckShare: AppCtx['toggleDeckShare'] = async (startupId, investorId) => {
    const uid = myUid;
    const d = dbx();
    const startup = startups.find(s => s.id === startupId);
    const has = !!startup?.deck?.sharedWith.includes(investorId);
    try {
      await updateDoc(doc(d, 'startups', startupId), {
        'deck.sharedWith': has ? arrayRemove(investorId) : arrayUnion(investorId),
        'deck.updatedAt': nowMs(),
      });
      await audit(has ? 'DECK_REVOKE' : 'DECK_GRANT', `${startupId} → ${investorId}`);
      const investor = investors.find(i => i.id === investorId);
      // Notices are only written to the OTHER party of an accepted connection, so
      // Firestore rules can validate cross-user notice writes against the connection doc.
      const conn = connections.find(c => c.startupId === startupId && c.investorId === investorId && c.status === 'accepted');
      if (conn && investor?.userId && investor.userId !== uid) {
        await noticeFor(investor.userId, {
          type: 'security',
          title: has ? 'Deck access revoked' : 'Deck access granted',
          body: `${startup?.name ?? 'A founder'} ${has ? 'revoked' : 'granted'} you watermarked deck preview access.`,
          link: `/app/startup/${startupId}`,
        }, conn.id).catch(() => undefined);
      }
    } catch (e) { console.error(e); }
  };

  const attachDeck: AppCtx['attachDeck'] = async (startupId, file) => {
    if (!file) return { err: 'Choose a PDF file.' };
    if (!/\.pdf$/i.test(file.name)) return { err: 'Only PDF decks are supported.' };
    if (file.size > MAX_DECK_MB * 1024 * 1024) return { err: `Decks are capped at ${MAX_DECK_MB} MB.` };
    try {
      const path = `decks/${startupId}/${safeFileName(file.name)}`;
      await uploadBytes(stRef(fbStorage(), path), file);
      const startup = startups.find(s => s.id === startupId);
      const deck: Deck = {
        name: file.name, sizeKB: Math.max(1, Math.round(file.size / 1024)),
        updatedAt: nowMs(), path, sharedWith: startup?.deck?.sharedWith ?? [],
      };
      await updateDoc(doc(dbx(), 'startups', startupId), { deck });
      await audit('DECK_UPLOAD', startupId);
      return { ok: 'uploaded' };
    } catch (e) { return { err: errOf(e, 'Upload failed.') }; }
  };

  const removeDeck: AppCtx['removeDeck'] = async (startupId) => {
    const startup = startups.find(s => s.id === startupId);
    if (startup?.deck) { try { await deleteObject(stRef(fbStorage(), startup.deck.path)); } catch { /* already gone */ } }
    await updateDoc(doc(dbx(), 'startups', startupId), { deck: null }).catch(() => undefined);
  };

  const deckBlobUrl: AppCtx['deckBlobUrl'] = async (deck) => {
    try {
      const blob = await getBlob(stRef(fbStorage(), deck.path));
      return URL.createObjectURL(blob);
    } catch (e) { console.warn('deck read denied', e); return null; }
  };

  const bumpMilestone: AppCtx['bumpMilestone'] = async (startupId, msId) => {
    const d = dbx();
    const snap = await getDoc(doc(d, 'startups', startupId)).catch(() => null);
    if (!snap || !snapExists(snap)) return;
    const s = snap.data() as Startup;
    const next = (s.milestones ?? []).map(m => m.id === msId
      ? { ...m, progress: Math.min(100, m.progress + 12), status: m.progress + 12 >= 100 ? 'done' as const : m.status }
      : m);
    try {
      await updateDoc(doc(d, 'startups', startupId), { milestones: next });
      await audit('MILESTONE_BUMP', msId);
    } catch (e) { console.error(e); }
  };

  const myVoice = useMemo(() => {
    for (const c of channelsMeta) {
      const members = voiceMap[c.id] ?? [];
      if (myUid && members.some(v => v.id === myUid)) return c.id;
    }
    return null;
  }, [channelsMeta, voiceMap, myUid]);

  const joinVoice = async (channelId: string) => {
    const uid = myUid; const cur = meRaw;
    if (!uid || !cur) return;
    await setDoc(doc(dbx(), 'channels', channelId, 'voice', uid), {
      name: cur.name, hue: cur.hue, joinedAt: nowMs(), muted: false,
    }).catch(() => undefined);
  };
  const leaveVoice = async (channelId: string) => {
    if (!myUid) return;
    await deleteDoc(doc(dbx(), 'channels', channelId, 'voice', myUid)).catch(() => undefined);
  };

  const setUserStatus: AppCtx['setUserStatus'] = async (userId, status) => {
    try {
      await updateDoc(doc(dbx(), 'users', userId), { status });
      await audit(status === 'suspended' ? 'USER_SUSPEND' : 'USER_REINSTATE', userId);
    } catch (e) { console.error(e); }
  };

  const resolveFlag: AppCtx['resolveFlag'] = async (flagId) => {
    try {
      await updateDoc(doc(dbx(), 'flags', flagId), { status: 'resolved' });
      await audit('FLAG_RESOLVE', flagId);
    } catch (e) { console.error(e); }
  };

  const createFlag: AppCtx['createFlag'] = async (target, reason, content) => {
    try {
      const cu = fbAuth().currentUser;
      // Rules require status == 'open' and a numeric ts; extra fields (target)
      // are allowed and read by the admin queue.
      await addDoc(collection(dbx(), 'flags'), {
        content, author: cu?.email ?? meEmail, reason, ts: nowMs(), status: 'open',
        targetType: target.type, targetId: target.id,
      });
      await audit('FLAG_CREATE', `${target.type}:${target.id}`);
    } catch (e) { console.error('flag create failed', e); }
  };

  const api: AppCtx = {
    ready, hydrated, bootError, db, user, fbUser: authUser,
    pendingReg, mfaChallenge, resetChallenge,
    signup, verifyEmail, resendVerification, login, verifyMfa, forgot, resetPass, logout,
    completeOnboarding, createStartup, setFocusStartup,
    sendConnection, respondConnection, setConnStage, sendMsg, setTyping, reactMsg,
    postChannelMsg, reactChannelMsg, clearChannelUnread, voiceIn: myVoice, joinVoice, leaveVoice, markRead, pushNotice,
    rsvp, progressLesson, updateStartup, toggleDeckShare, attachDeck, removeDeck, deckBlobUrl,
    bumpMilestone, setUserStatus, resolveFlag, createFlag, audit,
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

/* --------------------------------------------------------- assembly --- */
function assembleChannels(
  meta: (ChannelMeta & { id: string })[],
  chanMsgs: Record<string, ChannelMsg[]>,
  voiceMap: Record<string, VoiceMember[]>,
  reads: ({ lastRead: number } & { id: string })[],
  myUid: string | null,
): Channel[] {
  const readMap = new Map(reads.map(r => [r.id, r.lastRead]));
  return meta.map(c => {
    const msgs = chanMsgs[c.id] ?? [];
    const lastRead = readMap.get(c.id) ?? 0;
    const unread = msgs.filter(m => m.ts > lastRead && m.authorId !== myUid).length;
    const voiceMembers = (voiceMap[c.id] ?? [])
      .filter(v => v.id !== myUid)
      .map(v => ({ name: v.name, hue: v.hue }));
    return {
      id: c.id, kind: c.kind, name: c.name, desc: c.desc ?? '',
      msgs, unread, voiceMembers, threads: [],
    } as Channel;
  });
}

/** Guarded db accessor (throws a console-visible error if env missing). */
function dbx() {
  if (!initFirebase()) throw new Error('Firebase not configured');
  return fbDb();
}

/** Which of a founder's (possibly several) startups is currently in focus. */
export function activeStartup(db: { startups: Startup[] }, user: User | null): Startup | undefined {
  if (!user) return undefined;
  const owned = db.startups.filter(s => s.ownerId === user.id);
  return owned.find(s => s.id === user.focusStartupId) ?? owned[0];
}

export { MIN, HOUR, DAY };
