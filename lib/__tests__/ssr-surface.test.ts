import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import Chat from '@/components/Chat';

// The default surface (SSR of the empty state) must carry zero model/AI
// chrome — the exact regression the Task 14 brief guards against.
const html = renderToString(createElement(Chat));

describe('SSR surface', () => {
  it('renders the greeting empty state with suggestion chips', () => {
    expect(html).toContain('Hi. What are we working on?');
    expect(html).toContain('Explain a concept from scratch');
    expect(html).toContain('Solve this step by step');
    expect(html).toContain('Summarize something for me');
    expect(html).toContain('Help me draft a reply');
  });

  it('shows no model, provider, or AI jargon on the default surface', () => {
    expect(html).not.toMatch(/model/i);
    expect(html).not.toMatch(/provider/i);
    expect(html).not.toMatch(/\bAI\b/);
    expect(html).not.toMatch(/Test Model/);
  });
});
