import { streamText, type UIMessage } from 'ai';
import { buildModelMessages, getModel, mapProviderError } from '@/lib/provider';

export const maxDuration = 30;
const MAX_CHARS = 8000;

export async function POST(req: Request) {
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
