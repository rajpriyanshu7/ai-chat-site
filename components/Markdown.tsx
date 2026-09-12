'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { isValidElement, useState, type ReactNode } from 'react';

export function codeTextOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'bigint') return String(node);
  if (Array.isArray(node)) return node.map(codeTextOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return codeTextOf(node.props.children);
  return '';
}

function CodeBlock({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(codeTextOf(children));
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
    setTimeout(() => setStatus('idle'), 1500);
  }
  return (
    <div className="relative">
      <button type="button" onClick={copy} className="absolute right-2 top-2 rounded border bg-white px-2 py-0.5 text-xs">
        {status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : 'Copy'}
      </button>
      <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-sm text-gray-100"><code>{children}</code></pre>
    </div>
  );
}

export default function Markdown({ text }: { text: string }) {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ pre: ({ children }) => <CodeBlock>{children}</CodeBlock> }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
