import { neon } from '@neondatabase/serverless';

// NOTE (Task 8 fix): `neon()` validates the connection string eagerly and throws at
// construction time when DATABASE_URL is missing/malformed. Creating the client at
// module top level would therefore throw at import time — outside callers' try/catch —
// taking the route down instead of failing open. So `sql` is a lazy proxy with the same
// call signature (usable as a template tag): the real client is created on first QUERY,
// meaning `neon()`'s synchronous throw surfaces inside the caller's try/catch
// (e.g. `checkRateLimit`), which fails open as specified.
type NeonClient = ReturnType<typeof neon>;

function createClient(): NeonClient {
  return neon(process.env.DATABASE_URL ?? 'postgresql://localhost/unused');
}

export const sql = new Proxy(function () {}, {
  apply(_target, _thisArg, args: unknown[]) {
    const client = createClient() as unknown as (...a: never[]) => unknown;
    return Reflect.apply(client, undefined, args);
  },
  get(_target, prop: string | symbol) {
    const client = createClient() as unknown as Record<PropertyKey, unknown>;
    const value = client[prop];
    return typeof value === 'function'
      ? (value as (...a: never[]) => unknown).bind(client)
      : value;
  },
}) as unknown as NeonClient;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS rate_hits (ip TEXT NOT NULL, ts BIGINT NOT NULL);
CREATE INDEX IF NOT EXISTS rate_hits_ip_ts ON rate_hits (ip, ts);
CREATE TABLE IF NOT EXISTS usage_day (
  day TEXT PRIMARY KEY,
  messages INT NOT NULL DEFAULT 0,
  spend_cents DOUBLE PRECISION NOT NULL DEFAULT 0
);`;
