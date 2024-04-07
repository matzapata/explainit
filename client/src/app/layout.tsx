import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/lib/providers/provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ExplainIt',
  description: 'Create interactive chats for your documentation website',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} dark:bg-gray-950 min-h-screen`}
        suppressHydrationWarning={true}
      >
        <Providers>{children}</Providers>
        <Toaster />

        {/* Cloudflare Web Analytics */}
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "65484acb9faa47bb9ea65760673ef182"}'
        ></script>
      </body>
    </html>
  );
}
