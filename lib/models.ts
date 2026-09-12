export interface ChatModel { id: string; label: string; }

const FALLBACK: ChatModel[] = [{ id: 'test-model', label: 'Test Model' }];

export const MODELS: ChatModel[] = (() => {
  try {
    const raw = process.env.AI_MODELS_JSON ?? process.env.NEXT_PUBLIC_AI_MODELS_JSON;
    if (!raw) return FALLBACK;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return FALLBACK;
    return parsed.filter(m => typeof m?.id === 'string' && typeof m?.label === 'string');
  } catch {
    return FALLBACK;
  }
})();
