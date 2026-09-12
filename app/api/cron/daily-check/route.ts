import * as Sentry from '@sentry/nextjs';
import { daySpendCents } from '@/lib/usage';

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET ?? '';
  const got = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!secret || got !== secret) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const spendCents = await daySpendCents();
  const budgetCents = Number(process.env.DAILY_BUDGET_CENTS ?? 1000);
  const over = spendCents >= budgetCents;
  if (over) {
    Sentry.captureMessage(`Daily AI spend over budget: ${spendCents}c >= ${budgetCents}c`, 'warning');
  }
  return Response.json({ spendCents, budgetCents, over });
}
