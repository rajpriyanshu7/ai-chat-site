import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed">
        <p>
          No accounts: this site does not require registration and does not keep
          user profiles.
        </p>
        <p>
          Your chats are stored only in your own browser (local storage on your
          device). They are never uploaded to our servers for storage.
        </p>
        <p>
          When you send a message, it is relayed to our AI provider for
          inference in order to generate a reply. The provider may process
          message contents to produce that reply.
        </p>
        <p>
          Questions about privacy or deletion:{' '}
          [owner email — set at launch].
        </p>
      </div>
      <p className="mt-6 text-sm">
        <Link href="/" className="underline">Back to chat</Link>
      </p>
    </main>
  );
}
