import { useEffect, useState, type ReactNode, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Landmark, Rocket, ShieldCheck, Eye, EyeOff, KeyRound, MailCheck } from 'lucide-react';
import { Logo, Btn, Input, Field, toast } from '../components/ui';
import { useApp } from '../lib/store';

/* ------------------------------------------------------------ backdrop */
function AuthShell({ children, side }: { children: ReactNode; side: 'founder' | 'investor' }) {
  return (
    <div data-role={side} className="flex min-h-screen bg-ink-950">
      {/* brand rail */}
      <div className="relative hidden w-[44%] overflow-hidden lg:block">
        <div className="aurora-pan absolute inset-0 bg-[url('/img/network.jpg')] bg-cover bg-center opacity-55" />
        <div className={`absolute inset-0 bg-gradient-to-tr ${side === 'founder' ? 'from-ink-950 via-ink-950/72 to-gold-600/20' : 'from-ink-950 via-ink-950/72 to-iris-600/25'}`} />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link to="/"><Logo size={34} /></Link>
          <div>
            <p className="serif-i text-[30px] leading-snug text-white/90">“Every great round begins as a conversation — we just make sure it‛s the right one.”</p>
            <div className="mt-5 flex items-center gap-3">
              <span className="h-10 w-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600" />
              <div>
                <div className="text-[13.5px] font-semibold text-white">VentureSetu network</div>
                <div className="text-[11.5px] text-white/50">Verified founders ⇄ investors</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/35">
            <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-400" /> Firebase Auth</span>
            <span>Email verified</span><span>Rules-enforced</span>
          </div>
        </div>
      </div>
      {/* form side */}
      <div className="relative flex flex-1 items-center justify-center px-5 py-12">
        <div className="absolute inset-0 bg-[url('/img/aurora.jpg')] bg-cover bg-center opacity-[.12] lg:hidden" />
        <div className="absolute inset-0 bg-ink-950/70 lg:hidden" />
        <div className="relative w-full max-w-[430px]">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-[12.5px] font-medium text-white/45 transition hover:text-white"><ArrowLeft size={14} /> Back to home</Link>
          {children}
        </div>
      </div>
    </div>
  );
}

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {[...Array(total)].map((_, i) => (
        <span key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= step ? 'w-7 a-grad' : 'w-3 bg-white/12'}`} style={i <= step ? { background: 'linear-gradient(90deg, rgb(var(--acc2)), rgb(var(--acc)))' } : {}} />
      ))}
    </div>
  );
}

function PassInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? '••••••••'} autoComplete="current-password" />
      <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-white/75">
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function Strength({ pass }: { pass: string }) {
  const score = [pass.length >= 8, /[A-Z]/.test(pass), /\d/.test(pass), /[^A-Za-z0-9]/.test(pass)].filter(Boolean).length;
  if (!pass) return null;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div className="mt-2">
      <div className="flex gap-1">{[0, 1, 2, 3].map(i => (
        <span key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? (score <= 1 ? 'bg-rose-400' : score === 2 ? 'bg-amber-400' : score === 3 ? 'bg-lime-400' : 'bg-emerald-400') : 'bg-white/10'}`} />
      ))}</div>
      <p className="mt-1 text-[11px] text-white/40">{score > 0 ? labels[score - 1] : 'Weak'} — use 8+ chars with a number & symbol.</p>
    </div>
  );
}

function VerifyMail({ email, onContinue, busy }: { email: string; onContinue: () => Promise<unknown>; busy?: boolean }) {
  const { resendVerification } = useApp();
  const [sent, setSent] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="rounded-xl border border-gold-500/25 bg-gold-500/[.06] p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15 text-gold-300"><MailCheck size={18} /></span>
          <div>
            <div className="text-[13.5px] font-semibold text-white">Verification email sent</div>
            <div className="text-[11.5px] text-white/45">We emailed a secure verification link to</div>
          </div>
        </div>
        <p className="mt-3 break-all rounded-lg bg-ink-950/60 px-3.5 py-2 font-mono text-[12.5px] text-gold-200">{email}</p>
        <p className="mt-3 text-[12.5px] leading-relaxed text-white/55">
          Open the email and click <span className="font-medium text-white/85">“Verify email”</span> — the link opens a new tab. Then come back here and press Continue.
        </p>
        <Btn size="lg" className="mt-5 w-full" disabled={busy} onClick={async () => onContinue()}>
          {busy ? 'Checking…' : 'I\u2019ve verified — continue'} <ArrowRight size={16} />
        </Btn>
        <button type="button" onClick={async () => {
          const r = await resendVerification();
          if ('err' in r) toast(r.err, 'warn'); else { setSent(true); setTimeout(() => setSent(false), 4000); }
        }} className="mt-3 w-full text-center text-[12px] text-white/40 transition hover:text-white/70">
          {sent ? 'Resent — check your inbox ✓' : 'Didn\u2019t receive it? Resend the email'}
        </button>
      </div>
    </motion.div>
  );
}

/* ================================================================ LOGIN */
export function LoginPage() {
  const { login, user, bootError } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);

  if (user) return <Navigate to={user.onboarded ? '/app/dashboard' : `/onboarding/${user.role}`} replace />;

  const doLogin = async (e?: FormEvent) => {
    e?.preventDefault();
    setBusy(true); setErr('');
    const r = await login(email, pass);
    setBusy(false);
    if ('err' in r) { setErr(r.err); setShake(s => s + 1); return; }
    toast('Welcome back');
    nav('/app/dashboard');
  };

  return (
    <AuthShell side="founder">
      {bootError && <FatalBanner msg={bootError} />}
      <motion.div key={shake} animate={shake ? { x: [0, -9, 9, -5, 5, 0] } : {}} transition={{ duration: 0.4 }}>
        <h1 className="text-display text-[30px] font-medium text-white">Welcome back to the <span className="serif-i text-grad-gold">bridge</span>.</h1>
        <p className="mt-2 text-[13.5px] text-white/50">Sign in with the account you verified at signup.</p>
      </motion.div>

      <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-4.5" onSubmit={doLogin}>
        <Field label="Work email" required>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.in" autoComplete="email" />
        </Field>
        <Field label="Password" required hint={<Link to="/forgot" className="a-text transition hover:brightness-125">Forgot?</Link>}>
          <PassInput value={pass} onChange={setPass} />
        </Field>
        {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-rose-500/10 px-3.5 py-2.5 text-[12.5px] text-rose-300">{err}</motion.p>}
        <Btn type="submit" size="lg" className="w-full" disabled={busy || !email.trim() || !pass}>{busy ? 'Verifying…' : 'Sign in'} <ArrowRight size={16} /></Btn>
        <p className="pt-1 text-center text-[12.5px] text-white/45">New to VentureSetu? <Link to="/signup" className="a-text font-medium hover:brightness-125">Create an account</Link></p>
      </motion.form>
    </AuthShell>
  );
}

/* ================================================================ SIGNUP */
export function SignupPage() {
  const { signup, verifyEmail, pendingReg, user, fbUser, bootError } = useApp();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [role, setRole] = useState<'founder' | 'investor'>((sp.get('role') as 'founder' | 'investor') || 'founder');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const userRole = user?.role ?? role;

  // Auto-advance the moment Firebase reports the email verified (link clicked in the other tab).
  // NOTE: this effect must stay ABOVE the `if (user)` early return below — a
  // conditional return before a hook makes React throw "Rendered fewer hooks"
  // the instant the users doc lands and `user` flips truthy.
  useEffect(() => {
    if (step === 'verify' && pendingReg && fbUser?.emailVerified) {
      (async () => {
        const r = await verifyEmail(pendingReg.email);
        if (!('err' in r)) toast('Email verified — welcome aboard');
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, pendingReg, fbUser?.emailVerified]);

  if (user) return <Navigate to={user.onboarded ? '/app/dashboard' : `/onboarding/${user.role}`} replace />;

  // Onward routing (to onboarding once the users doc exists, or dashboard if
  // already onboarded) is handled by the <Navigate> above — an effect that
  // navigated on `step` alone fired BEFORE verification/users-doc, bounced
  // the user out of the verify step and lost the form. Do not re-add it.

  return (
    <AuthShell side={role}>
      {bootError && <FatalBanner msg={bootError} />}
      <StepDots step={step === 'form' ? 0 : 1} total={2} />
      <AnimatePresence mode="wait">
        {step === 'form' ? (
          <motion.div key="f" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <h1 className="text-display mt-5 text-[30px] font-medium text-white">Create your <span className="a-grad-txt serif-i">{role === 'founder' ? 'founder' : 'investor'}</span> account.</h1>
            <p className="mt-2 text-[13.5px] text-white/50">Verified profiles only. Takes about a minute.</p>

            <div className="mt-7 grid grid-cols-2 gap-2 rounded-2xl border border-white/[.08] bg-white/[.03] p-1.5" role="radiogroup" aria-label="Choose role">
              {([
                { id: 'founder', icon: <Rocket size={16} />, t: 'I\u2019m building', d: 'Raise & track my round' },
                { id: 'investor', icon: <Landmark size={16} />, t: 'I invest', d: 'Source verified deal flow' },
              ] as const).map(o => (
                <button type="button" key={o.id} onClick={() => setRole(o.id)} role="radio" aria-checked={role === o.id}
                  className={`relative rounded-xl border p-3.5 text-left transition-all duration-200 ${role === o.id ? 'border-transparent' : 'border-white/[.06] hover:border-white/20'}`}
                  style={role === o.id ? { background: 'linear-gradient(135deg, rgb(var(--acc)/.18), rgb(var(--acc)/.06))', boxShadow: '0 0 0 1.5px rgb(var(--acc)/.55)' } : {}}>
                  <span className={`flex items-center gap-2 text-[13.5px] font-semibold ${role === o.id ? 'a-text' : 'text-white/80'}`}>{o.icon}{o.t}</span>
                  <span className="mt-1 block text-[11px] text-white/40">{o.d}</span>
                </button>
              ))}
            </div>

            <form className="mt-5 space-y-4" onSubmit={async e => {
              e.preventDefault(); setBusy(true); setErr('');
              const r = await signup(name, email, pass, role, false);
              setBusy(false);
              if ('err' in r) { setErr(r.err); return; }
              setStep('verify');
              toast('Verification email sent');
            }}>
              <Field label="Full name" required><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ananya Iyer" autoComplete="name" /></Field>
              <Field label="Work email" required><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.in" autoComplete="email" /></Field>
              <Field label="Password" required><PassInput value={pass} onChange={setPass} placeholder="Min. 8 characters" /><Strength pass={pass} /></Field>

              <div className="flex w-full items-center justify-between rounded-xl border border-white/[.09] bg-white/[.03] px-4 py-3 text-left">
                <span>
                  <span className="flex items-center gap-2 text-[13px] font-medium text-white/85"><KeyRound size={14} className="a-text" /> MFA</span>
                  <span className="mt-0.5 block text-[11px] text-white/40">Kept off so your project never leaves the free tier. TOTP enrollment is documented for later (Identity Platform upgrade).</span>
                </span>
                <ChipLock />
              </div>
              {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-rose-500/10 px-3.5 py-2.5 text-[12.5px] text-rose-300">{err}</motion.p>}
              <Btn type="submit" size="lg" className="w-full" disabled={busy || !name.trim() || !email.trim() || pass.length < 8}>{busy ? 'Creating…' : 'Create account'} <ArrowRight size={16} /></Btn>
              <p className="text-center text-[11px] leading-relaxed text-white/35">Passwords are handled entirely by Firebase Auth — never by this app. By continuing you agree to the acceptable-use policy and DPDP-aligned privacy terms.</p>
            </form>
          </motion.div>
        ) : (
          <motion.div key="v" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
            <h1 className="text-display text-[30px] font-medium text-white">Verify your <span className="serif-i a-grad-txt">email</span>.</h1>
            <p className="mt-2 text-[13.5px] text-white/50">It\u2019s the last step before your profile goes live.</p>
            <div className="mt-6">
              <VerifyMail email={pendingReg?.email ?? email} onContinue={async () => {
                setBusy(true); setErr('');
                const r = await verifyEmail(pendingReg?.email ?? email);
                setBusy(false);
                if ('err' in r) { setErr(r.err); toast(r.err, 'warn'); return; }
                toast('Email verified — welcome aboard');
                nav(`/onboarding/${userRole}`);
              }} busy={busy} />
              {err && <p className="mt-3 rounded-lg bg-rose-500/10 px-3.5 py-2.5 text-[12.5px] text-rose-300">{err}</p>}
              <button className="mt-3 w-full text-center text-[12px] text-white/40 transition hover:text-white/70" onClick={() => setStep('form')}>← Use a different email</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {step === 'form' && <p className="mt-5 text-center text-[12.5px] text-white/45">Already verified? <Link to="/login" className="a-text font-medium hover:brightness-125">Sign in</Link></p>}
    </AuthShell>
  );
}

/* ================================================================ FORGOT */
export function ForgotPage() {
  const { forgot, resetChallenge, bootError } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <AuthShell side="founder">
      {bootError && <FatalBanner msg={bootError} />}
      <StepDots step={resetChallenge ? 1 : 0} total={2} />
      <h1 className="text-display mt-5 text-[30px] font-medium text-white">Reset your <span className="serif-i text-grad-gold">password</span>.</h1>
      <p className="mt-2 text-[13.5px] text-white/50">
        {resetChallenge
          ? 'Check your inbox — Firebase emailed you a secure reset link.'
          : 'Enter your account email and we\u2019ll send a secure reset link.'}
      </p>
      <form className="mt-7 space-y-4" onSubmit={async e => {
        e.preventDefault(); setBusy(true); setErr('');
        const r = await forgot(email);
        setBusy(false);
        if ('err' in r) setErr(r.err);
        else { toast('Reset link sent — check your inbox'); nav('/login'); }
      }}>
        {resetChallenge ? (
          <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[.06] p-5">
            <div className="flex items-center gap-2 text-[13.5px] font-semibold text-emerald-300"><MailCheck size={15} /> Reset email sent</div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/55">
              Open the link in the email to <span className="text-white/85">set a new password</span>. Once done, return here and sign in with it.
            </p>
            <Link to="/login"><Btn className="mt-4 w-full" size="lg">Back to sign in <ArrowRight size={15} /></Btn></Link>
          </div>
        ) : (
          <>
            <Field label="Account email" required><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.in" autoFocus /></Field>
            {err && <p className="rounded-lg bg-rose-500/10 px-3.5 py-2.5 text-[12.5px] text-rose-300">{err}</p>}
            <Btn type="submit" size="lg" className="w-full" disabled={busy || !email.trim()}>{busy ? 'Sending…' : 'Send reset link'} <ArrowRight size={16} /></Btn>
          </>
        )}
      </form>
      <p className="mt-5 text-center text-[12.5px] text-white/45"><Link to="/login" className="a-text font-medium hover:brightness-125">← Back to sign in</Link></p>
    </AuthShell>
  );
}

/* ------------------------------------------------------------- bits ---- */
function ChipLock() {
  return (
    <span className="relative ml-3 h-6 w-11 shrink-0 rounded-full bg-white/12 opacity-80">
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white/60" />
    </span>
  );
}

function FatalBanner({ msg }: { msg: string }) {
  return (
    <div className="mb-6 rounded-xl border border-rose-400/25 bg-rose-400/[.07] px-4 py-3 text-[12px] leading-relaxed text-rose-200">
      <span className="font-semibold">Configuration error — </span>{msg}
    </div>
  );
}
