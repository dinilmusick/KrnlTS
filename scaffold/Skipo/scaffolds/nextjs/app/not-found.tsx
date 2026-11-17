import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--skipo-bg)] text-[var(--skipo-text)] flex flex-col items-center justify-center p-6 font-mono">
      <div className="border-2 border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-black text-[var(--skipo-accent)] mb-2">404</h1>
        <p className="text-sm font-bold uppercase tracking-wider mb-4">Page Not Found</p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-[var(--skipo-accent)] text-black text-xs font-black uppercase tracking-wider"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
