import { createUIMessageStream, createUIMessageStreamResponse, streamText, type UIMessage, type UIMessageChunk } from 'ai';
import { buildModelMessages, listCandidates, mapProviderError, modelFor, ProviderError } from '@/lib/provider';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { overBudget, recordUsage } from '@/lib/usage';

export const maxDuration = 30;
const MAX_CHARS = 8000;

export async function POST(req: Request) {
  const rl = await checkRateLimit(clientIp(req));
  if (!rl.ok) {
    return Response.json({ error: 'Too many messages. Please wait a little and try again.' }, { status: 429, headers: { 'Retry-After': '60' } });
  }
  if (await overBudget()) {
    return Response.json({ error: 'Free usage for today is used up. Please come back tomorrow.' }, { status: 429 });
  }
  try {
    const body = await req.json();
    const messages = body?.messages as UIMessage[] | undefined;
    const modelId = String(body?.model ?? '');
    if (!Array.isArray(messages) || messages.length === 0 || !modelId) {
      return Response.json({ error: 'messages[] and model are required' }, { status: 400 });
    }
    const tooLong = messages.some(m =>
      m.parts?.some(p => p.type === 'text' && 'text' in p && p.text.length > MAX_CHARS));
    if (tooLong) return Response.json({ error: 'a message exceeds 8000 characters' }, { status: 400 });

    const modelMessages = buildModelMessages(messages);
    const chain = listCandidates();
    const at = chain.findIndex(c => c.id === modelId);
    // Respect the user's pick first, then fail over through the rest in order.
    const ordered = at >= 0 ? [chain[at], ...chain.slice(0, at), ...chain.slice(at + 1)] : [];
    if (ordered.length === 0) throw new ProviderError(`unknown model: ${modelId}`);

    // Failover: try each candidate; forward the first stream that produces
    // content. A candidate that errors before any text-delta is discarded
    // silently and the next one fires — the user never sees the switch.
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        let lastError: unknown = null;
        for (const c of ordered) {
          console.log(JSON.stringify({ route: '/api/chat', attempt: `${c.providerName}:${c.id}` }));
          const result = streamText({
            model: modelFor(c),
            messages: modelMessages,
            onFinish: ({ usage }) => {
              void recordUsage(c.id, usage.inputTokens ?? 0, usage.outputTokens ?? 0);
            },
          });
          const ui = result.toUIMessageStream({ sendStart: false });
          const [head, tail] = ui.tee();
          const buffered: UIMessageChunk[] = [];
          let failed = false;
          try {
            const reader = head.getReader();
            for (;;) {
              const { done, value } = await reader.read();
              if (done) {
                failed = !buffered.some(b => b.type === 'text-delta');
                break;
              }
              buffered.push(value);
              if (value.type === 'error') { failed = true; break; }
              if (value.type === 'text-delta') break;
              if (buffered.length >= 100) break; // long lead-in: commit, forward rest live
            }
            reader.releaseLock();
          } catch (e) {
            failed = true;
            lastError = e;
          }
          if (failed) {
            const errText = buffered
              .filter((b): b is Extract<UIMessageChunk, { type: 'error' }> => b.type === 'error')
              .map(b => b.errorText)
              .join(' ');
            lastError = new Error(errText || 'candidate produced no content');
            try { await tail.cancel(); } catch { /* already closed */ }
            try { await head.cancel(); } catch { /* already closed */ }
            continue;
          }
          writer.write({ type: 'start' });
          for (const chunk of buffered) writer.write(chunk);
          writer.merge(tail);
          try { await head.cancel(); } catch { /* already closed */ }
          return;
        }
        throw lastError instanceof Error ? lastError : new Error('all candidates failed');
      },
      onError: e => mapProviderError(e).message,
    });
    return createUIMessageStreamResponse({ stream });
  } catch (e) {
    const mapped = mapProviderError(e);
    console.error(JSON.stringify({ route: '/api/chat', status: mapped.status })); // no contents
    return Response.json({ error: mapped.message }, { status: mapped.status });
  }
}
