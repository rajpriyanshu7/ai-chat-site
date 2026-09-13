'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Children, isValidElement, useState, type ReactNode } from 'react';

export function codeTextOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'bigint') return String(node);
  if (Array.isArray(node)) return node.map(codeTextOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return codeTextOf(node.props.children);
  return '';
}

/** Extracts the fenced language from the inner `<code className="language-x">`. */
function languageOf(children: ReactNode): string | null {
  const child = Children.toArray(children)[0];
  if (isValidElement<{ className?: string }>(child)) {
    const cls = child.props.className ?? '';
    const m = /language-([\w+#-]+)/.exec(cls);
    if (m) return m[1];
  }
  return null;
}

function CodeBlock({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const lang = languageOf(children);
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
      <div className="absolute right-3 top-2 z-10 flex items-center gap-2.5">
        {lang && <span className="select-none text-[11px] leading-5 text-dim">{lang}</span>}
        <button
          type="button"
          onClick={copy}
          className="px-2.5 py-1.5 text-[12px] font-medium text-dim transition-colors hover:text-text"
        >
          {status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : 'Copy'}
        </button>
      </div>
      <pre><code>{children}</code></pre>
    </div>
  );
}

export default function Markdown({ text }: { text: string }) {
  return (
    <div className="md max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          // Wrap tables so they scroll horizontally on narrow screens
          // instead of blowing out the 46rem thread column.
          table: ({ children }) => (
            <div className="md-table-wrap">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
