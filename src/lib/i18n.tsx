import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Lang } from './types';

const dict: Record<Lang, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard', 'nav.matching': 'AI Matching', 'nav.profileF': 'My Startup', 'nav.profileI': 'My Profile',
    'nav.community': 'Community', 'nav.messages': 'Messages', 'nav.tracker': 'Funding Tracker', 'nav.pipeline': 'Pipeline',
    'nav.notifications': 'Notifications', 'nav.admin': 'Admin Console', 'nav.events': 'Funding Events', 'nav.learning': 'Learning Studio',
    'nav.market': 'Market Access', 'nav.schemes': 'Schemes & Policies', 'nav.news': 'Startup News', 'nav.faq': 'FAQ',
    'nav.login': 'Sign in', 'nav.start': 'Get started', 'nav.logout': 'Log out',
    'sec.overview': 'Overview', 'sec.network': 'Network', 'sec.resources': 'Resources',
    'hero.badge': 'India\'s verified founder ⇄ investor bridge',
    'hero.t1': 'Where bold founders', 'hero.t2': 'meet conviction capital.',
    'hero.sub': 'VentureSetu runs the entire funding lifecycle — discover, evaluate, connect, discuss, fund, track — inside one audited, AI-matched, community-powered platform.',
    'hero.ctaF': 'Start raising', 'hero.ctaI': 'I invest capital',
    'hero.watch': 'Watch the platform flow',
    'common.search': 'Search startups, investors, topics…',
    'common.viewAll': 'View all', 'common.send': 'Send', 'common.back': 'Back', 'common.save': 'Save changes',
    'lang.name': 'English',
  },
  hi: {
    'nav.dashboard': 'डैशबोर्ड', 'nav.matching': 'AI मैचिंग', 'nav.profileF': 'मेरा स्टार्टअप', 'nav.profileI': 'मेरी प्रोफ़ाइल',
    'nav.community': 'समुदाय', 'nav.messages': 'संदेश', 'nav.tracker': 'फंडिंग ट्रैकर', 'nav.pipeline': 'पाइपलाइन',
    'nav.notifications': 'सूचनाएँ', 'nav.admin': 'एडमिन कंसोल', 'nav.events': 'फंडिंग इवेंट्स', 'nav.learning': 'लर्निंग स्टूडियो',
    'nav.market': 'मार्केट एक्सेस', 'nav.schemes': 'योजनाएँ व नीतियाँ', 'nav.news': 'स्टार्टअप समाचार', 'nav.faq': 'प्रश्नोत्तर',
    'nav.login': 'साइन इन', 'nav.start': 'शुरू करें', 'nav.logout': 'लॉग आउट',
    'sec.overview': 'अवलोकन', 'sec.network': 'नेटवर्क', 'sec.resources': 'संसाधन',
    'hero.badge': 'भारत का सत्यापित फाउंडर ⇄ इन्वेस्टर सेतु',
    'hero.t1': 'जहाँ साहसी फाउंडर', 'hero.t2': 'दृढ़ पूँजी से मिलते हैं।',
    'hero.sub': 'VentureSetu पूरे फंडिंग जीवनचक्र को चलाता है — खोजें, मूल्यांकन करें, जुड़ें, चर्चा करें, फंड पाएँ, ट्रैक करें — एक ही ऑडिटेड, AI-मैच्ड प्लेटफ़ॉर्म पर।',
    'hero.ctaF': 'फंड्रेज़ शुरू करें', 'hero.ctaI': 'मैं निवेश करता/करती हूँ',
    'hero.watch': 'प्लेटफ़ॉर्म फ़्लो देखें',
    'common.search': 'स्टार्टअप, निवेशक, विषय खोजें…',
    'common.viewAll': 'सभी देखें', 'common.send': 'भेजें', 'common.back': 'वापस', 'common.save': 'सहेजें',
    'lang.name': 'हिन्दी',
  },
  ta: {
    'nav.dashboard': 'டாஷ்போர்டு', 'nav.matching': 'AI பொருத்தம்', 'nav.profileF': 'என் ஸ்டார்ட்அப்', 'nav.profileI': 'என் சுயவிவரம்',
    'nav.community': 'சமூகம்', 'nav.messages': 'செய்திகள்', 'nav.tracker': 'நிதி டிராக்கர்', 'nav.pipeline': 'பைப்லைன்',
    'nav.notifications': 'அறிவிப்புகள்', 'nav.admin': 'நிர்வாகம்', 'nav.events': 'நிதி நிகழ்வுகள்', 'nav.learning': 'கற்றல் ஸ்டூடியோ',
    'nav.market': 'சந்தை அணுகல்', 'nav.schemes': 'திட்டங்கள் & கொள்கைகள்', 'nav.news': 'ஸ்டார்ட்அப் செய்திகள்', 'nav.faq': 'கேள்விகள்',
    'nav.login': 'உள்நுழை', 'nav.start': 'தொடங்கு', 'nav.logout': 'வெளியேறு',
    'sec.overview': 'கண்ணோட்டம்', 'sec.network': 'நெட்வொர்க்', 'sec.resources': 'வளங்கள்',
    'hero.badge': 'இந்தியாவின் சரிபார்க்கப்பட்ட நிறுவனர் ⇄ முதலீட்டாளர் பாலம்',
    'hero.t1': 'துணிச்சலான நிறுவனர்கள்', 'hero.t2': 'நம்பிக்கை மூலதனத்தை சந்திக்கும் இடம்.',
    'hero.sub': 'VentureSetu முழு நிதியுதவி வாழ்க்கைச் சுழற்சியையும் இயக்குகிறது — கண்டுபிடி, மதிப்பீடு, இணைப்பு, விவாதம், நிதி, கண்காணிப்பு — ஒரே தணிக்கை தளத்தில்.',
    'hero.ctaF': 'நிதி திரட்டத் தொடங்கு', 'hero.ctaI': 'நான் முதலீடு செய்கிறேன்',
    'hero.watch': 'தள ஓட்டத்தைப் பார்க்க',
    'common.search': 'ஸ்டார்ட்அப், முதலீட்டாளர் தேடுக…',
    'common.viewAll': 'அனைத்தும்', 'common.send': 'அனுப்பு', 'common.back': 'பின்', 'common.save': 'சேமி',
    'lang.name': 'தமிழ்',
  },
};

interface I18n { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string }
const LCtx = createContext<I18n>({ lang: 'en', setLang: () => {}, t: k => k });
export const useI18n = () => useContext(LCtx);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('vs_lang') as Lang) || 'en');
  const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem('vs_lang', l); } catch { /* */ } };
  const t = (k: string) => dict[lang][k] ?? dict.en[k] ?? k;
  return <LCtx.Provider value={{ lang, setLang, t }}>{children}</LCtx.Provider>;
}

export const langs: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' }, { id: 'hi', label: 'हिन्दी' }, { id: 'ta', label: 'தமிழ்' },
];
