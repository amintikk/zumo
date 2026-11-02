/**
 * Public, anonymous counters ("zumo en cifras").
 *
 * After a download the browser sends only totals: how many images, bytes
 * before and after, and the output format. No file names, no image content,
 * no identifiers and no cookies, so it does not depend on the analytics
 * consent. The server keeps running sums only.
 */
const endpoint = '/api/stats';

export interface PublicStats {
  since: string;
  images: number;
  bytesSaved: number;
  averageReduction: number;
  zips: number;
  favouriteFormat: string | null;
}

export interface Report {
  images: number;
  before: number;
  after: number;
  format: string;
  zip?: boolean;
}

export function reportOptimized(report: Report): void {
  if (__PRERENDER__ || !report.images || !report.before || !report.after) {
    return;
  }
  try {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export async function fetchStats(): Promise<PublicStats | undefined> {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) return undefined;
    return (await response.json()) as PublicStats;
  } catch {
    return undefined;
  }
}
