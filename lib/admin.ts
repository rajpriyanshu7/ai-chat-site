import { timingSafeEqual } from 'node:crypto';

export function isAdmin(req: Request): boolean {
  const token = process.env.ADMIN_TOKEN ?? '';
  if (!token) return false;
  const got = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(got);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
