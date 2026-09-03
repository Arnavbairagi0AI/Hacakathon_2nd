import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './lib/store';
import { I18nProvider } from './lib/i18n';
import { ToastHost } from './components/ui';
import { AppShell, Guard, Splash } from './components/layout';
import Landing from './pages/Landing';
import { LoginPage, SignupPage, ForgotPage } from './pages/Auth';
import { FounderOnboarding, InvestorOnboarding } from './pages/Onboarding';

const DashboardRouter = lazy(() => import('./pages/Dashboards').then(m => ({ default: m.DashboardRouter })));
const Matching = lazy(() => import('./pages/Matching'));
const Connections = lazy(() => import('./pages/Connections'));
const Community = lazy(() => import('./pages/Community'));
const Messages = lazy(() => import('./pages/Messages'));
const Tracker = lazy(() => import('./pages/Tracker'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Admin = lazy(() => import('./pages/Admin'));
const StartupProfile = lazy(() => import('./pages/Profiles').then(m => ({ default: m.StartupProfile })));
const InvestorProfile = lazy(() => import('./pages/Profiles').then(m => ({ default: m.InvestorProfile })));
const Content = {
  FAQ: lazy(() => import('./pages/Content').then(m => ({ default: m.FAQBody }))),
  Events: lazy(() => import('./pages/Content').then(m => ({ default: m.EventsBody }))),
  Learning: lazy(() => import('./pages/Content').then(m => ({ default: m.LearningBody }))),
  Schemes: lazy(() => import('./pages/Content').then(m => ({ default: m.SchemesBody }))),
  News: lazy(() => import('./pages/Content').then(m => ({ default: m.NewsBody }))),
  Market: lazy(() => import('./pages/Content').then(m => ({ default: m.MarketBody }))),
  Chrome: lazy(() => import('./pages/Content').then(m => ({ default: m.PublicChrome }))),
};

function OnbGuard({ children }: { children: ReactNode }) {
  const { user, ready } = useApp();
  if (!ready) return <Splash note="Preparing onboarding…" />;
  if (!user) return <Navigate to="/signup" replace />;
  if (user.onboarded) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

function L({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Splash />}>{children}</Suspense>;
}
function LP({ children }: { children: ReactNode }) {
  return <L><Content.Chrome>{children as ReactNode}</Content.Chrome></L>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-950 text-center" data-role="founder">
      <span className="text-display text-[64px] text-grad-gold font-medium">404</span>
      <p className="text-white/50">This corridor doesn\u2019t exist — but the bridge does.</p>
      <a href="/" className="a-btn rounded-xl px-5 py-2.5 text-[13.5px]">Back to VentureSetu</a>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot" element={<ForgotPage />} />
            <Route path="/onboarding/founder" element={<OnbGuard><FounderOnboarding /></OnbGuard>} />
            <Route path="/onboarding/investor" element={<OnbGuard><InvestorOnboarding /></OnbGuard>} />

            {/* public content */}
            <Route path="/events" element={<LP><Content.Events /></LP>} />
            <Route path="/learning" element={<LP><Content.Learning /></LP>} />
            <Route path="/market" element={<LP><Content.Market /></LP>} />
            <Route path="/schemes" element={<LP><Content.Schemes /></LP>} />
            <Route path="/news" element={<LP><Content.News /></LP>} />
            <Route path="/faq" element={<LP><Content.FAQ /></LP>} />

            {/* app */}
            <Route path="/app" element={<Guard><AppShell /></Guard>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<L><DashboardRouter /></L>} />
              <Route path="matching" element={<Guard roles={['founder', 'investor']}><L><Matching /></L></Guard>} />
              <Route path="connections" element={<Guard roles={['founder', 'investor']}><L><Connections /></L></Guard>} />
              <Route path="community" element={<Guard roles={['founder', 'investor']}><L><Community /></L></Guard>} />
              <Route path="messages" element={<Guard roles={['founder', 'investor']}><L><Messages /></L></Guard>} />
              <Route path="messages/:threadId" element={<Guard roles={['founder', 'investor']}><L><Messages /></L></Guard>} />
              <Route path="tracker" element={<Guard roles={['founder', 'investor']}><L><Tracker /></L></Guard>} />
              <Route path="notifications" element={<L><Notifications /></L>} />
              <Route path="startup/:id" element={<L><StartupProfile /></L>} />
              <Route path="investor/:id" element={<L><InvestorProfile /></L>} />
              <Route path="profile" element={<Guard roles={['investor']}><L><InvestorProfile /></L></Guard>} />
              <Route path="admin" element={<Guard roles={['admin']}><L><Admin /></L></Guard>} />
              <Route path="events" element={<L><Content.Events /></L>} />
              <Route path="learning" element={<L><Content.Learning /></L>} />
              <Route path="market" element={<L><Content.Market /></L>} />
              <Route path="schemes" element={<L><Content.Schemes /></L>} />
              <Route path="news" element={<L><Content.News /></L>} />
              <Route path="faq" element={<L><Content.FAQ /></L>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          <ToastHost />
        </BrowserRouter>
      </AppProvider>
    </I18nProvider>
  );
}
