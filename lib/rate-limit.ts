import { sql } from './db';

export function isAllowed(hits: number[], now: number, limit: number, windowMs: number): boolean {
  const cutoff = now - windowMs;
  return hits.filter(t => t > cutoff).length < limit;
}

export async function checkRateLimit(ip: string): Promise<{ ok: boolean }> {
  const limit = Number(process.env.RATE_LIMIT_PER_HOUR ?? 30);
  const now = Date.now();
  try {
    await sql`INSERT INTO rate_hits (ip, ts) VALUES (${ip}, ${now})`;
    await sql`DELETE FROM rate_hits WHERE ts < ${now - 3_600_000}`;
    const rows = await sql`SELECT ts FROM rate_hits WHERE ip = ${ip} AND ts > ${now - 3_600_000}`;
    const hits = (rows as { ts: number }[]).map(r => Number(r.ts));
    return { ok: isAllowed(hits, now, limit, 3_600_000) };
  } catch (e) {
    console.error(JSON.stringify({ route: 'rate-limit', note: 'fail-open', err: String(e).slice(0, 120) }));
    return { ok: true };
  }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return (fwd?.split(',')[0]?.trim() || 'unknown').slice(0, 64);
}
