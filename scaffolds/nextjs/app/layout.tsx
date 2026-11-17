import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MyApp',
  description: 'MyApp — Built on Next.js with Skipo Framework',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--skipo-bg)] text-[var(--skipo-text)] font-mono antialiased">
        {children}
      </body>
    </html>
  );
}
