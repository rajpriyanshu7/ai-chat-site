import { sql } from '@/lib/db';

export async function GET() {
  let db: 'up' | 'down' = 'down';
  let provider: 'up' | 'down' = 'down';
  try {
    await sql`SELECT 1`;
    db = 'up';
  } catch { /* stays down */ }
  try {
    const base = process.env.AI_PROVIDER_BASE_URL;
    if (base) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(`${base.replace(/\/$/, '')}/models`, {
        headers: { Authorization: `Bearer ${process.env.AI_PROVIDER_API_KEY ?? ''}` },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (res.ok) provider = 'up';
    }
  } catch { /* stays down */ }
  return Response.json({ ok: db === 'up' && provider === 'up', db, provider, time: new Date().toISOString() });
}
