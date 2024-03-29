import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/lib/providers/provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chatwith',
  description: 'Chat with any file using ai',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="">
      {/* className dark for dark theme */}
      <body
        className={`${inter.className} dark:bg-gray-950 min-h-screen`}
        suppressHydrationWarning={true}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
