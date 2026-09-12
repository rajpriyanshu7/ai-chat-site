import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Terms of Use</h1>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed">
        <p>
          This is a free service for personal use.
        </p>
        <p>
          No abuse or automation: do not misuse the service, attempt to disrupt
          it, or access it with bots, scrapers, or other automated means.
        </p>
        <p>
          AI answers may be wrong. Do not rely on replies for medical, legal,
          financial, or other high-stakes decisions — verify important
          information independently.
        </p>
      </div>
      <p className="mt-6 text-sm">
        <Link href="/" className="underline">Back to chat</Link>
      </p>
    </main>
  );
}
