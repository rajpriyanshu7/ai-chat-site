import 'server-only';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { convertToModelMessages, type UIMessage } from 'ai';

export class ProviderError extends Error {}

interface PricedModel { id: string; label: string; inPer1k: number; outPer1k: number; }

function pricedModels(): PricedModel[] {
  const raw = process.env.AI_MODELS_JSON;
  if (!raw) throw new ProviderError('AI_MODELS_JSON is not configured');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) throw new ProviderError('AI_MODELS_JSON is empty');
  return parsed;
}

function client() {
  const baseURL = process.env.AI_PROVIDER_BASE_URL;
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  if (!baseURL) throw new ProviderError('AI_PROVIDER_BASE_URL is not configured');
  if (!apiKey) throw new ProviderError('AI_PROVIDER_API_KEY is not configured');
  return createOpenAICompatible({ name: 'custom', baseURL, apiKey });
}

export function getModel(id: string) {
  const known = pricedModels().some(m => m.id === id);
  if (!known) throw new ProviderError(`unknown model: ${id}`);
  return client()(id);
}

export function buildModelMessages(ui: UIMessage[]) {
  const system = process.env.AI_SYSTEM_PROMPT?.trim() || 'You are a helpful assistant. Format code clearly.';
  const converted = convertToModelMessages(ui.filter(m => m.parts?.some(p => p.type === 'text')));
  const tail = converted.slice(-20);
  return [{ role: 'system' as const, content: system }, ...tail];
}

export function estimateCostCents(modelId: string, inTokens: number, outTokens: number): number {
  const m = pricedModels().find(x => x.id === modelId);
  if (!m) return 0;
  return (inTokens / 1000) * m.inPer1k * 100 + (outTokens / 1000) * m.outPer1k * 100;
}

export function mapProviderError(e: unknown): { status: number; message: string } {
  const anyE = e as { statusCode?: number; message?: string };
  const msg = String(anyE?.message ?? 'provider error');
  if (anyE?.statusCode === 429 || /rate limit|quota|429/i.test(msg)) {
    return { status: 429, message: 'AI service is busy right now. Please retry in a few seconds.' };
  }
  if (e instanceof ProviderError) return { status: 500, message: 'AI provider is not configured yet.' };
  return { status: 502, message: 'AI service failed. Please retry.' };
}
