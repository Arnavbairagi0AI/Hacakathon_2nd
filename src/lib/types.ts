export type Role = 'founder' | 'investor' | 'admin';
export type Lang = 'en' | 'hi' | 'ta';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Mirrors Firebase Auth emailVerified; refreshed on sign-in/verification. */
  verified: boolean;
  /** TOTP MFA intent. Real enrollment requires the (free-tier-optional) Identity Platform upgrade; see docs/FIREBASE.md. */
  mfa: boolean;
  status: 'active' | 'suspended';
  phone?: string;
  company?: string;
  title?: string;
  location?: string;
  hue: number;
  createdAt: number;
  onboarded: boolean;
  /** Investor profile doc id — equals the user's uid in the real data layer. */
  investorProfileId?: string;
  focusStartupId?: string;
}

export interface Deck {
  name: string;
  /** Real size in KB from the uploaded file. */
  sizeKB: number;
  updatedAt: number;
  /** Investor profile ids (== their user uid) with preview access. */
  sharedWith: string[];
  /** Firebase Storage object path, e.g. decks/<startupId>/<file>. */
  path: string;
}

export interface Traction { label: string; value: string; delta?: string }

export interface Milestone {
  id: string; label: string; detail: string; amountL?: number;
  date: string; status: 'done' | 'active' | 'upcoming'; progress: number;
}

export interface FounderInfo {
  name: string; title: string; bio: string;
  qualifications: string[]; experience: string[];
}

export interface Startup {
  id: string; ownerId: string; /** ms epoch — the listings query orders by this. */
  createdAt: number; name: string; tagline: string;
  sector: string; stage: string; location: string; founded: number; team: number;
  pitch: string; problem: string; solution: string; market: string; model: string;
  founder: FounderInfo;
  askL: number; equityPct: number; raisedL: number;
  cashL: number; burnL: number; revenueL: number; prevRevenueL: number;
  revSeries: number[]; burnSeries: number[]; months: string[];
  cac?: number; ltv?: number; growthPct: number;
  traction: Traction[]; highlights: string[]; tags: string[];
  milestones: Milestone[];
  deck?: Deck;
  readiness: number; hue: number;
}

export interface Investor {
  id: string; userId?: string; name: string; firm: string; title: string;
  email: string; phone: string; location: string; hue: number;
  bio: string; thesis: string;
  sectors: string[]; stages: string[]; geos: string[];
  chequeMinL: number; chequeMaxL: number;
  qualifications: string[]; collaborations: string[];
  portfolio: { name: string; sector: string }[];
  deals: number; aumCr: number; response: number; medCloseDays: number;
  verified: boolean; active: boolean;
}

export interface Match {
  id: string; score: number;
  sector: number; stage: number; cheque: number; geo: number;
  reasons: string[]; signal: string;
}

export type OppStage = 'intro' | 'diligence' | 'term-sheet' | 'funded';

export interface Connection {
  id: string; startupId: string; investorId: string; fromRole: Role;
  message: string; status: 'pending' | 'accepted' | 'declined';
  createdAt: number; stage: OppStage;
}

export interface MsgFile {
  name: string;
  sizeKB: number;
  /** Firebase Storage object path, e.g. files/threads/<threadId>/<msgId>/<name>. */
  path: string;
}

export interface Msg {
  id: string; senderId: string; ts: number;
  text?: string; file?: MsgFile;
  reactions: Record<string, number>;
}

export interface Party { userId: string; name: string; org: string; hue: number; online: boolean }

export interface Thread {
  id: string; connId: string;
  pair: [Party, Party];
  typing: boolean; deckShared: boolean; msgs: Msg[];
}

export interface ChannelMsg {
  id: string; author: string; hue: number; roleTag: string; ts: number;
  text: string; reactions: Record<string, number>; reply?: string;
  /** Author uid — used by the client to compute per-channel unread. */
  authorId?: string;
}

export interface Channel {
  id: string; kind: 'text' | 'voice'; name: string; desc: string;
  msgs?: ChannelMsg[];
  voiceMembers?: { name: string; hue: number; speaking?: boolean }[];
  unread?: number;
  threads?: { title: string; count: number }[];
}

export interface Notice {
  id: string; type: 'match' | 'connect' | 'message' | 'milestone' | 'system' | 'security';
  title: string; body: string; ts: number; read: boolean; link: string;
}

export interface VEvent {
  id: string; title: string; kind: string; date: string; time: string;
  where: string; host: string; seats: number; left: number;
  desc: string; tags: string[]; featured?: boolean;
  /** Live counters maintained from the events doc (clients increment on RSVP). */
  rsvpCount?: number;
  mine?: boolean;
}

export interface MarketProgram {
  id: string; title: string; org: string; kind: string;
  desc: string; points: string[]; hue: number; tags: string[];
}

export interface Track {
  id: string; title: string; level: string; mins: number; lessons: number;
  done: number; desc: string; author: string; hue: number; tags: string[];
}

export interface Scheme {
  id: string; name: string; by: string; benefit: string; elig: string[];
  sector: string[]; stage: string; deadline: string; hue: number;
}

export interface News {
  id: string; title: string; src: string; ts: number; tag: string;
  desc: string; mins: number; featured?: boolean;
}

export interface Faq { q: string; a: string; cat: string }

export interface Audit { id: string; ts: number; actor: string; action: string; target: string; ip: string }
export interface Flag { id: string; content: string; author: string; reason: string; ts: number; status: 'open' | 'resolved' }

export interface Session { token: string; userId: string; mfaPassed: boolean; expires: number }
