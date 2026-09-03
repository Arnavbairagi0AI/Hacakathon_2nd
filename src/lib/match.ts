import type { Startup, Investor, Match } from './types';
import { fmtL } from './format';

/** Transparent AI matching across 4 axes + signals. */
export function scoreMatch(startup: Startup, inv: Investor): Match {
  // sectors — overlap strength
  const sOverlap = startup.tags.some(t => inv.sectors.some(s => s.toLowerCase().includes(t.split('-')[0])))
    || inv.sectors.includes(startup.sector);
  const sector = inv.sectors.includes(startup.sector) ? 1 : sOverlap ? 0.7 : inv.sectors.length > 3 ? 0.25 : 0.35;

  // stage — does the startup stage sit inside the investor's mandate
  const stages = ['Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth'];
  const si = stages.indexOf(startup.stage);
  let stage = 0;
  if (inv.stages.includes(startup.stage)) stage = 1;
  else if (inv.stages.some(s => Math.abs(stages.indexOf(s) - si) === 1)) stage = 0.55;
  else stage = 0.2;

  // cheque — ask vs range with graceful decay
  let cheque = 0;
  if (startup.askL >= inv.chequeMinL && startup.askL <= inv.chequeMaxL) cheque = 1;
  else if (startup.askL < inv.chequeMinL) cheque = Math.max(0.15, startup.askL / inv.chequeMinL);
  else cheque = Math.max(0.1, 1 - (startup.askL - inv.chequeMaxL) / inv.chequeMaxL);

  // geo
  const geo = inv.geos.includes('Pan-India') || inv.geos.includes('Global') || inv.geos.includes(startup.location) ? 1 : 0.45;

  // base score, then signal boosts
  let score = Math.round((0.32 * sector + 0.22 * stage + 0.30 * cheque + 0.16 * geo) * 100);
  if (startup.readiness >= 80) score += 4; else if (startup.readiness >= 70) score += 2;
  if (startup.growthPct >= 12) score += 3;
  if (inv.response >= 85) score += 1;
  score = Math.min(98, Math.max(24, score));

  const reasons: string[] = [];
  if (sector === 1) reasons.push(`Direct sector fit — ${inv.firm} leads ${startup.sector} rounds`);
  else if (sector > 0.5) reasons.push(`Adjacent thesis — ${startup.sector} maps to their ${inv.sectors[0]} focus`);
  else reasons.push(`Outside core sectors, but ${inv.firm} keeps a broad mandate`);
  if (stage === 1) reasons.push(`${startup.stage} sits squarely in their ${inv.stages.join(' / ')} mandate`);
  else if (stage > 0.4) reasons.push(`One stage away from mandate centre (${startup.stage} vs ${inv.stages[0]})`);
  else reasons.push(`Stage gap — they typically write ${inv.stages[0]} cheques`);
  if (cheque === 1) reasons.push(`Your ${fmtL(startup.askL)} ask fits their ${fmtL(inv.chequeMinL)}–${fmtL(inv.chequeMaxL)} cheque`);
  else if (startup.askL > inv.chequeMaxL) reasons.push(`Ask (${fmtL(startup.askL)}) is above their usual ceiling — frame as co-invest`);
  else reasons.push(`Ask is below their minimum — may prefer to track first`);
  if (geo === 1) reasons.push(inv.geos.includes(startup.location) ? `Local to their ${startup.location} coverage` : `They deploy ${inv.geos.includes('Global') ? 'globally' : 'pan-India'}`);
  else reasons.push(`Geography is outside their named coverage`);
  if (startup.readiness >= 78) reasons.push(`Readiness ${startup.readiness}/100 lifts you above 90% of their inbound`);

  const signal =
    score >= 88 ? 'Exceptional alignment on all four axes' :
    score >= 75 ? 'Strong fit — worth a tailored outreach' :
    score >= 60 ? 'Workable fit — lead with traction' :
    'Weak structural fit — consider relationship-building instead';

  return { id: `${startup.id}::${inv.id}`, score, sector, stage, cheque, geo, reasons, signal };
}

export function rankMatches(startup: Startup, investors: Investor[]): { inv: Investor; m: Match }[] {
  return investors.filter(i => i.active).map(inv => ({ inv, m: scoreMatch(startup, inv) })).sort((a, b) => b.m.score - a.m.score);
}
export function rankStartups(inv: Investor, startups: Startup[]): { st: Startup; m: Match }[] {
  return startups.map(st => ({ st, m: scoreMatch(st, inv) })).sort((a, b) => b.m.score - a.m.score);
}
