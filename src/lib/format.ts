/** Format a figure given in ₹ lakh into L / Cr. */
export function fmtL(lakhs: number): string {
  if (lakhs >= 100) {
    const cr = lakhs / 100;
    return `₹${cr >= 10 ? cr.toFixed(0) : cr.toFixed(1)} Cr`;
  }
  return `₹${lakhs % 1 === 0 ? lakhs : lakhs.toFixed(1)} L`;
}
export function fmtCr(lakhs: number): string {
  return `₹${(lakhs / 100).toFixed(lakhs >= 1000 ? 0 : 1)} Cr`;
}
export function inr(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}
export function num(n: number): string {
  return n.toLocaleString('en-IN');
}
export function pct(n: number, dp = 0): string {
  return `${n.toFixed(dp)}%`;
}
export function initials(name: string): string {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}
export function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}
export function fmtDay(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}
export const MIN = 60_000, HOUR = 3_600_000, DAY = 86_400_000;
export function uid(p = 'id'): string {
  return `${p}_${Math.random().toString(36).slice(2, 9)}`;
}
export function runway(cashL: number, burnL: number): number {
  return burnL <= 0 ? Infinity : cashL / burnL;
}
export function growthPct(series: number[]): number {
  const a = series[0] || 1, b = series[series.length - 1] || 1;
  return a <= 0 ? 0 : ((b - a) / a) * 100;
}
