'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, type ReactNode } from 'react';

function CodeBlock({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  async function copy(): Promise<void> {
    const text = String(children ?? '');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="relative">
      <button onClick={copy} className="absolute right-2 top-2 rounded border bg-white px-2 py-0.5 text-xs">
        {copied ? 'Copied' : 'Copy'}
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
