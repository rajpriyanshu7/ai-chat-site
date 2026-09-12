import { isAdmin } from '@/lib/admin';
import { sql } from '@/lib/db';

export async function GET(req: Request) {
  if (!isAdmin(req)) return Response.json({ error: 'forbidden' }, { status: 403 });
  const rows = await sql`SELECT day, messages, spend_cents FROM usage_day ORDER BY day DESC LIMIT 14`;
  return Response.json({ days: rows });
}
