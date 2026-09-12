import { sql } from './db';
import { estimateCostCents } from './provider';

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function centsFor(modelId: string, inTokens: number, outTokens: number): number {
  return estimateCostCents(modelId, inTokens, outTokens);
}

export async function daySpendCents(day = todayKey()): Promise<number> {
  try {
    const rows = await sql`SELECT spend_cents FROM usage_day WHERE day = ${day}`;
    return Number((rows as { spend_cents: number }[])[0]?.spend_cents ?? 0);
  } catch {
    return 0; // fail-open read: unknown spend never blocks chat by itself
  }
}

export async function overBudget(): Promise<boolean> {
  const cap = Number(process.env.DAILY_BUDGET_CENTS ?? 1000);
  return (await daySpendCents()) >= cap;
}

export async function recordUsage(modelId: string, inTokens: number, outTokens: number): Promise<void> {
  const cents = estimateCostCents(modelId, inTokens, outTokens);
  const day = todayKey();
  try {
    await sql`INSERT INTO usage_day (day, messages, spend_cents) VALUES (${day}, 1, ${cents})
      ON CONFLICT (day) DO UPDATE SET messages = usage_day.messages + 1, spend_cents = usage_day.spend_cents + ${cents}`;
  } catch (e) {
    console.error(JSON.stringify({ route: 'recordUsage', err: String(e).slice(0, 120) }));
  }
}
