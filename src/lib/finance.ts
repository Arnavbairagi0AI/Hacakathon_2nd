import type { Startup } from './types';

/** Funding-readiness: weighted, explainable score out of 100. */
export function readinessOf(s: Startup): { score: number; parts: { label: string; pts: number; max: number; note: string }[] } {
  const runway = s.burnL > 0 ? s.cashL / s.burnL : 99;
  const growth = s.growthPct;
  const burnMultiple = s.revSeries.length > 1
    ? (s.burnSeries.reduce((a, b) => a + b, 0)) / Math.max(1, (s.revSeries[s.revSeries.length - 1] - s.revSeries[0]) * 12)
    : 5;
  const parts = [
    { label: 'Runway', pts: runway >= 18 ? 22 : runway >= 12 ? 18 : runway >= 8 ? 13 : runway >= 5 ? 8 : 3, max: 22, note: `${isFinite(runway) ? runway.toFixed(1) : '—'} months of cash at current burn` },
    { label: 'Revenue growth', pts: growth >= 15 ? 24 : growth >= 10 ? 19 : growth >= 6 ? 14 : growth >= 3 ? 9 : 4, max: 24, note: `${growth}% MoM revenue growth rate` },
    { label: 'Capital efficiency', pts: burnMultiple <= 1 ? 18 : burnMultiple <= 2 ? 14 : burnMultiple <= 4 ? 9 : 5, max: 18, note: `${burnMultiple.toFixed(1)}× net burn per rupee of new ARR` },
    { label: 'Traction & proof', pts: s.traction.length >= 4 ? 16 : s.traction.length >= 3 ? 12 : 7, max: 16, note: `${s.traction.length} verified traction signals on profile` },
    { label: 'Materials & deck', pts: s.deck ? 12 : 4, max: 12, note: s.deck ? `Deck uploaded · ${(s.deck.sizeKB / 1024).toFixed(1)} MB` : 'No deck uploaded' },
    { label: 'Team & plan depth', pts: s.founder.qualifications.length >= 3 && s.milestones.length >= 4 ? 8 : 5, max: 8, note: 'Founder history + milestone roadmap documented' },
  ];
  const raw = parts.reduce((a, p) => a + p.pts, 0);
  const max = parts.reduce((a, p) => a + p.max, 0);
  return { score: Math.round((raw / max) * 100), parts };
}

export function readinessTone(score: number): { label: string; desc: string } {
  if (score >= 85) return { label: 'Institution-ready', desc: 'Top 5% of profiles — expect proactive inbound.' };
  if (score >= 75) return { label: 'Strong', desc: 'Above the diligence threshold for most seed/A funds.' };
  if (score >= 62) return { label: 'Competitive', desc: 'Fundable with a tight narrative and warm intros.' };
  if (score >= 45) return { label: 'Developing', desc: 'Close the flagged gaps before wide outreach.' };
  return { label: 'Early', desc: 'Build fundamentals before active fundraising.' };
}
