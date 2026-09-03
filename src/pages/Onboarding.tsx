import { useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Landmark, Rocket, Sparkles, UploadCloud, X, BadgeCheck } from 'lucide-react';
import { Logo, Btn, Field, Input, Textarea, Select, Chip, toast } from '../components/ui';
import { useApp } from '../lib/store';
import type { Startup } from '../lib/types';

const SECTORS = ['Fintech', 'SaaS', 'HealthTech', 'EdTech', 'AgriTech', 'Consumer', 'DeepTech', 'Climate', 'D2C', 'Marketplace', 'PropTech', 'AI/ML'];
const STAGES = ['Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth'];
const GEOS = ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Pan-India', 'Global'];

function MultiPick({ options, values, onChange, max }: { options: string[]; values: string[]; onChange: (v: string[]) => void; max?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const on = values.includes(o);
        return (
          <button type="button" key={o} aria-pressed={on}
            onClick={() => onChange(on ? values.filter(v => v !== o) : (max && values.length >= max ? (toast(`Pick up to ${max}`, 'warn'), values) : [...values, o]))}
            className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-all duration-200 ${on ? 'a-soft scale-[1.03]' : 'border-white/12 text-white/55 hover:border-white/30 hover:text-white/85'}`}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState('');
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 transition focus-within:border-[rgb(var(--acc)/.55)]">
      <div className="mb-1.5 flex flex-wrap gap-1.5">
        {values.map(v => (
          <Chip key={v} tone="acc">{v}<button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter(x => x !== v))}><X size={11} /></button></Chip>
        ))}
      </div>
      <input value={draft} onChange={e => setDraft(e.target.value)} placeholder={placeholder}
        onKeyDown={e => { if (e.key === 'Enter' && draft.trim()) { e.preventDefault(); if (!values.includes(draft.trim())) onChange([...values, draft.trim()]); setDraft(''); } }}
        className="w-full bg-transparent text-[13px] text-white/90 placeholder:text-white/28 outline-none" />
    </div>
  );
}

function WizardShell({ role, steps, step, children, title, sub }: { role: 'founder' | 'investor'; steps: string[]; step: number; title: ReactNode; sub: string; children: ReactNode }) {
  return (
    <div data-role={role} className="relative min-h-screen bg-ink-950">
      <div className="pointer-events-none fixed inset-0 bg-[url('/img/aurora.jpg')] bg-cover bg-center opacity-[.09]" />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-ink-950/30 to-ink-950" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-8 lg:flex-row lg:gap-14 lg:px-8">
        {/* rail */}
        <aside className="mb-8 lg:mb-0 lg:w-[300px] lg:shrink-0 lg:pt-6">
          <Logo />
          <h1 className="text-display mt-8 hidden text-[26px] font-medium leading-tight text-white lg:block">{title}</h1>
          <p className="mt-3 hidden text-[13px] leading-relaxed text-white/45 lg:block">{sub}</p>
          <ol className="mt-8 flex gap-4 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:space-y-5 lg:overflow-visible">
            {steps.map((s, i) => (
              <li key={s} className="flex shrink-0 items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-[12px] font-semibold transition-all duration-300 ${i < step ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300' : i === step ? 'a-soft' : 'border-white/12 text-white/35'}`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </span>
                <span className={`text-[12.5px] font-medium ${i === step ? 'text-white' : i < step ? 'text-white/60' : 'text-white/35'}`}>{s}</span>
              </li>
            ))}
          </ol>
          <div className="mt-10 hidden items-center gap-2 text-[11px] text-white/35 lg:flex"><BadgeCheck size={13} className="text-emerald-400" /> Saved securely · SHA-256 · role-limited</div>
        </aside>
        {/* body */}
        <main className="w-full max-w-[620px] flex-1 pb-16 lg:pt-6">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.35, ease: [0.22, 0.8, 0.3, 1] }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function StepFoot({ step, total, onBack, onNext, nextLabel, busy }: { step: number; total: number; onBack: () => void; onNext: () => void; nextLabel?: string; busy?: boolean }) {
  return (
    <div className="mt-9 flex items-center justify-between gap-3 border-t border-white/[.07] pt-6">
      <Btn variant="ghost" onClick={onBack} disabled={step === 0 || busy}><ArrowLeft size={15} /> Back</Btn>
      <span className="font-mono text-[11px] text-white/30">{step + 1} / {total}</span>
      <Btn onClick={onNext} disabled={busy}>{nextLabel ?? (step === total - 1 ? 'Finish' : 'Continue')} {busy ? '…' : <ArrowRight size={15} />}</Btn>
    </div>
  );
}

/* ====================================================== FOUNDER WIZARD */
export function FounderOnboarding() {
  const { user, completeOnboarding, attachDeck } = useApp();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: '', phone: '', location: 'Bengaluru', quals: [] as string[], exp: [] as string[],
    stName: '', tagline: '', sector: 'SaaS', stage: 'Seed', stLocation: 'Bengaluru', team: 4, founded: new Date().getFullYear(),
    pitch: '', problem: '', solution: '', market: '', model: '',
    askL: 200, cashL: 80, burnL: 8, revenueL: 0, raisedL: 0,
  });
  const [deckFile, setDeckFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  if (!user) return <Navigate to="/signup?role=founder" replace />;
  if (user.onboarded) return <Navigate to="/app/dashboard" replace />;
  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const finish = async () => {
    setBusy(true);
    const newId = await completeOnboarding(
      { title: form.title || 'Founder', phone: form.phone, location: form.location, company: form.stName },
      {
        name: form.stName || 'My Startup', tagline: form.tagline, sector: form.sector, stage: form.stage,
        location: form.stLocation, team: form.team, founded: form.founded, pitch: form.pitch, problem: form.problem,
        solution: form.solution, market: form.market, model: form.model, askL: form.askL, cashL: form.cashL,
        burnL: form.burnL, revenueL: form.revenueL, prevRevenueL: Math.max(0, form.revenueL - 1.2), raisedL: form.raisedL,
        founder: { name: user.name, title: form.title || 'Founder', bio: '', qualifications: form.quals, experience: form.exp },
        tags: [form.sector.toLowerCase()],
      } as Partial<Startup>,
    );
    if (deckFile && newId) {
      const r = await attachDeck(newId, deckFile);
      if ('err' in r) { toast(r.err, 'warn'); }
    }
    setBusy(false);
    if (!newId) { toast('Could not save your profile — check your connection', 'warn'); return; }
    toast('Startup profile created — welcome to the network');
    nav('/app/dashboard');
  };

  const steps = ['You', 'Startup', 'The plan', 'Financials', 'Review'];
  return (
    <WizardShell role="founder" steps={steps} step={step}
      title={<>Build your <span className="serif-i text-grad-gold">fund-ready</span> startup profile.</>}
      sub="Investors evaluate evidence. These five steps assemble your narrative, numbers and funding ask into a profile that ranks.">
      {step === 0 && (
        <div className="space-y-4.5">
          <h2 className="text-[22px] font-semibold text-white">First, who are you?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your role" required><Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Co-founder & CEO" /></Field>
            <Field label="Phone" hint="Only shared after connection"><Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98XXX XXXXX" /></Field>
          </div>
          <Field label="Based in" required><Select value={form.location} onChange={e => set('location', e.target.value)}>{GEOS.map(g => <option key={g}>{g}</option>)}</Select></Field>
          <Field label="Qualifications" hint="Press Enter to add"><TagInput values={form.quals} onChange={v => set('quals', v)} placeholder="e.g. IIT Bombay · IIM-A · Ex-Razorpay…" /></Field>
          <Field label="Relevant experience" hint="One line each"><TagInput values={form.exp} onChange={v => set('exp', v)} placeholder="e.g. 5 yrs fintech infrastructure…" /></Field>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4.5">
          <h2 className="text-[22px] font-semibold text-white">The startup you\u2019re raising for</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Startup name" required><Input value={form.stName} onChange={e => set('stName', e.target.value)} placeholder="Nexaflow" /></Field>
            <Field label="One-line tagline" required><Input value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="What do you do, plainly?" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sector" required><Select value={form.sector} onChange={e => set('sector', e.target.value)}>{SECTORS.map(s => <option key={s}>{s}</option>)}</Select></Field>
            <Field label="Stage" required><Select value={form.stage} onChange={e => set('stage', e.target.value)}>{STAGES.map(s => <option key={s}>{s}</option>)}</Select></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="HQ city"><Select value={form.stLocation} onChange={e => set('stLocation', e.target.value)}>{GEOS.map(g => <option key={g}>{g}</option>)}</Select></Field>
            <Field label="Team size"><Input type="number" min={1} value={form.team} onChange={e => set('team', +e.target.value)} /></Field>
            <Field label="Founded"><Input type="number" min={1990} max={2026} value={form.founded} onChange={e => set('founded', +e.target.value)} /></Field>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4.5">
          <h2 className="text-[22px] font-semibold text-white">The plan, in your words</h2>
          <Field label="Elevator pitch" hint="2–3 sentences"><Textarea rows={3} value={form.pitch} onChange={e => set('pitch', e.target.value)} placeholder="What you do, for whom, and why now…" /></Field>
          <Field label="The problem"><Textarea rows={3} value={form.problem} onChange={e => set('problem', e.target.value)} placeholder="Quantify the pain — who bleeds, how much, how often…" /></Field>
          <Field label="Your solution"><Textarea rows={3} value={form.solution} onChange={e => set('solution', e.target.value)} placeholder="Product, wedge, and why you win…" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Market"><Textarea rows={3} value={form.market} onChange={e => set('market', e.target.value)} placeholder="TAM / SAM with sources…" /></Field>
            <Field label="Business model"><Textarea rows={3} value={form.model} onChange={e => set('model', e.target.value)} placeholder="Pricing, margins, expansion motion…" /></Field>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4.5">
          <h2 className="text-[22px] font-semibold text-white">Financials & the ask</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Funding ask (₹ lakh)" required hint="e.g. 300 = ₹3 Cr"><Input type="number" min={0} value={form.askL} onChange={e => set('askL', +e.target.value)} /></Field>
            <Field label="Already raised (₹ lakh)"><Input type="number" min={0} value={form.raisedL} onChange={e => set('raisedL', +e.target.value)} /></Field>
            <Field label="Monthly revenue (₹ lakh)"><Input type="number" min={0} step={0.1} value={form.revenueL} onChange={e => set('revenueL', +e.target.value)} /></Field>
            <Field label="Monthly net burn (₹ lakh)"><Input type="number" min={0} step={0.1} value={form.burnL} onChange={e => set('burnL', +e.target.value)} /></Field>
            <Field label="Cash in bank (₹ lakh)"><Input type="number" min={0} value={form.cashL} onChange={e => set('cashL', +e.target.value)} /></Field>
          </div>
          <Field label="Pitch deck (PDF)" hint="Uploaded to Firebase Storage · sharing stays revocable">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[.02] px-4 py-8 text-center transition hover:border-[rgb(var(--acc)/.5)] hover:bg-white/[.04]">
              <UploadCloud size={22} className="a-text" />
              <span className="text-[13px] font-medium text-white/80">{deckFile ? deckFile.name : 'Drop your deck here, or click to browse'}</span>
              <span className="text-[11px] text-white/35">PDF up to 25 MB · real upload on launch</span>
              <input type="file" accept="application/pdf" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (f) {
                  if (f.size > 25 * 1024 * 1024) { toast('Max deck size is 25 MB', 'warn'); return; }
                  if (!/^\.pdf$/i.test(f.name.slice(f.name.lastIndexOf('.')))) { toast('Only PDF decks are supported', 'warn'); return; }
                  setDeckFile(f);
                  toast('Deck staged — uploads when you launch your profile');
                }
              }} />
            </label>
          </Field>
        </div>
      )}
      {step === 4 && (
        <div className="space-y-5">
          <h2 className="text-[22px] font-semibold text-white">Ready to launch your profile</h2>
          <div className="glass rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[19px] font-bold text-white">{form.stName || 'My Startup'}</div>
                <div className="mt-0.5 text-[13px] text-white/50">{form.tagline || '—'}</div>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: 'linear-gradient(135deg,#d4a253,#8b9fff)' }}><Rocket size={19} /></span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[['Sector', form.sector], ['Stage', form.stage], ['Ask', `₹${form.askL} L`], ['Runway', form.burnL > 0 ? `${(form.cashL / form.burnL).toFixed(1)} mo` : '∞']].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-white/[.04] px-3.5 py-3"><div className="text-[10.5px] uppercase tracking-wider text-white/38">{l}</div><div className="mt-0.5 text-[14.5px] font-semibold text-white">{v}</div></div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {deckFile && <Chip tone="jade">Deck staged — {deckFile.name}</Chip>}
              {form.quals.slice(0, 3).map(q => <Chip key={q}>{q}</Chip>)}
              {form.exp.slice(0, 2).map(q => <Chip key={q}>{q}</Chip>)}
            </div>
          </div>
          <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-white/45"><Sparkles size={14} className="mt-0.5 shrink-0 text-gold-400" /> Our matching engine will now score you against every verified investor mandate and generate your first recommendations.</p>
        </div>
      )}
      <StepFoot step={step} total={5} onBack={() => setStep(s => s - 1)} onNext={() => { if (step < 4) { window.scrollTo({ top: 0 }); setStep(s => s + 1); } else void finish(); }} nextLabel={step === 4 ? 'Launch profile' : undefined} busy={busy} />
    </WizardShell>
  );
}

/* ====================================================== INVESTOR WIZARD */
export function InvestorOnboarding() {
  const { user, completeOnboarding } = useApp();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: '', firm: '', phone: '', location: 'Mumbai', bio: '', quals: [] as string[], collabs: [] as string[],
    sectors: [] as string[], stages: [] as string[], geos: [] as string[], chequeMinL: 50, chequeMaxL: 500, thesis: '',
  });
  if (!user) return <Navigate to="/signup?role=investor" replace />;
  if (user.onboarded) return <Navigate to="/app/dashboard" replace />;
  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const steps = ['You', 'Mandate', 'Launch'];
  return (
    <WizardShell role="investor" steps={steps} step={step}
      title={<>Define your <span className="serif-i text-grad-iris">investment mandate</span>.</>}
      sub="Founders are matched against your sectors, stages, geography and cheque range — with full reasoning shown to both sides.">
      {step === 0 && (
        <div className="space-y-4.5">
          <h2 className="text-[22px] font-semibold text-white">Your investor identity</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" required><Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Partner" /></Field>
            <Field label="Firm / platform" required><Input value={form.firm} onChange={e => set('firm', e.target.value)} placeholder="Ardent Peak Capital" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" hint="Shared post-connection only"><Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98XXX XXXXX" /></Field>
            <Field label="Based in"><Select value={form.location} onChange={e => set('location', e.target.value)}>{GEOS.map(g => <option key={g}>{g}</option>)}</Select></Field>
          </div>
          <Field label="Bio" hint="How founders should read you"><Textarea rows={3} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Background, what you look for, how you work with founders…" /></Field>
          <Field label="Qualifications"><TagInput values={form.quals} onChange={v => set('quals', v)} placeholder="e.g. IIM-A · Ex-Avendus · Kauffman Fellow…" /></Field>
          <Field label="Collaborations / syndicates"><TagInput values={form.collabs} onChange={v => set('collabs', v)} placeholder="e.g. Co-invest with Peak XV, SaaSBoomi syndicate…" /></Field>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-[22px] font-semibold text-white">What you fund</h2>
          <Field label="Sectors" hint={`${form.sectors.length} selected`} required><MultiPick options={SECTORS} values={form.sectors} onChange={v => set('sectors', v)} max={5} /></Field>
          <Field label="Stages"><MultiPick options={STAGES} values={form.stages} onChange={v => set('stages', v)} max={4} /></Field>
          <Field label="Geography"><MultiPick options={GEOS} values={form.geos} onChange={v => set('geos', v)} max={5} /></Field>
          <Field label="Cheque range (₹ lakh)" hint={`₹${form.chequeMinL}L – ₹${form.chequeMaxL}L`}>
            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[.04] px-4 py-4">
              <input type="range" min={10} max={5000} step={5} value={form.chequeMinL} onChange={e => set('chequeMinL', Math.min(+e.target.value, form.chequeMaxL - 10))} className="w-full accent-[#8b9fff]" aria-label="Minimum cheque" />
              <input type="range" min={10} max={5000} step={5} value={form.chequeMaxL} onChange={e => set('chequeMaxL', Math.max(+e.target.value, form.chequeMinL + 10))} className="w-full accent-[#aebdff]" aria-label="Maximum cheque" />
            </div>
          </Field>
          <Field label="Investment thesis"><Textarea rows={3} value={form.thesis} onChange={e => set('thesis', e.target.value)} placeholder="The pattern you believe in, in two sentences…" /></Field>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-[22px] font-semibold text-white">Your mandate, locked in</h2>
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[18px] font-bold text-white">{user.name}</div>
                <div className="text-[13px] text-white/50">{form.title || 'Investor'} · {form.firm || 'Independent'}</div>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-950" style={{ background: 'linear-gradient(135deg,#cdd9ff,#6f82f2)' }}><Landmark size={19} /></span>
            </div>
            <div className="mt-5 space-y-3 text-[13px]">
              <div className="flex gap-2"><span className="w-24 shrink-0 text-white/40">Sectors</span><span className="flex flex-wrap gap-1.5">{form.sectors.map(s => <Chip key={s} tone="iris">{s}</Chip>)}</span></div>
              <div className="flex gap-2"><span className="w-24 shrink-0 text-white/40">Stages</span><span className="flex flex-wrap gap-1.5">{form.stages.map(s => <Chip key={s}>{s}</Chip>)}</span></div>
              <div className="flex gap-2"><span className="w-24 shrink-0 text-white/40">Geography</span><span className="flex flex-wrap gap-1.5">{form.geos.map(s => <Chip key={s}>{s}</Chip>)}</span></div>
              <div className="flex gap-2"><span className="w-24 shrink-0 text-white/40">Cheque</span><span className="font-mono text-iris-200">₹{form.chequeMinL}L – ₹{form.chequeMaxL}L</span></div>
            </div>
          </div>
          <p className="flex items-start gap-2 text-[12.5px] text-white/45"><Sparkles size={14} className="mt-0.5 shrink-0 text-iris-300" /> You\u2019ll now see startups ranked against this mandate, with transparent match reasoning and readiness scores.</p>
        </div>
      )}
      <StepFoot step={step} total={3} onBack={() => setStep(s => s - 1)} onNext={() => {
        if (step < 2) {
          if (step === 1 && (form.sectors.length === 0 || form.stages.length === 0 || form.geos.length === 0)) { toast('Pick at least one sector, stage and geography', 'warn'); return; }
          window.scrollTo({ top: 0 }); setStep(s => s + 1); return;
        }
        completeOnboarding(
          { title: form.title || 'Investor', phone: form.phone, location: form.location, company: form.firm },
          undefined,
          { title: form.title || 'Investor', firm: form.firm || 'Independent', phone: form.phone, location: form.location, bio: form.bio, qualifications: form.quals, collaborations: form.collabs, sectors: form.sectors, stages: form.stages, geos: form.geos, chequeMinL: form.chequeMinL, chequeMaxL: form.chequeMaxL, thesis: form.thesis },
        );
        toast('Mandate saved — deal flow unlocked');
        nav('/app/dashboard');
      }} nextLabel={step === 2 ? 'Enter investor network' : undefined} />
    </WizardShell>
  );
}
