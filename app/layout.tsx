import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cambium Protocol',
  description: 'Carbon credit marketplace on Stellar/Soroban',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <nav className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
              <div className="flex items-center gap-6">
                <Link href="/" className="text-xl font-bold text-green-700">
                  Cambium
                </Link>
                <Link href="/projects" className="text-sm text-gray-600 hover:text-gray-900">
                  Projects
                </Link>
                <Link href="/trade" className="text-sm text-gray-600 hover:text-gray-900">
                  Trade
                </Link>
                <Link href="/retire" className="text-sm text-gray-600 hover:text-gray-900">
                  Retire
                </Link>
                <Link href="/portfolio" className="text-sm text-gray-600 hover:text-gray-900">
                  Portfolio
                </Link>
              </div>
              <ConnectWallet />
            </div>
          </nav>
          <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
