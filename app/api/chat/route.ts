import { streamText, type UIMessage } from 'ai';
import { buildModelMessages, getModel, mapProviderError } from '@/lib/provider';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';

export const maxDuration = 30;
const MAX_CHARS = 8000;

export async function POST(req: Request) {
  const rl = await checkRateLimit(clientIp(req));
  if (!rl.ok) {
    return Response.json({ error: 'Too many messages. Please wait a little and try again.' }, { status: 429, headers: { 'Retry-After': '60' } });
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

    const result = streamText({ model: getModel(modelId), messages: buildModelMessages(messages) });
    return result.toUIMessageStreamResponse();
  } catch (e) {
    const mapped = mapProviderError(e);
    console.error(JSON.stringify({ route: '/api/chat', status: mapped.status })); // no contents
    return Response.json({ error: mapped.message }, { status: mapped.status });
  }
}
