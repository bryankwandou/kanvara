import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ServiceWorker } from '@/components/ServiceWorker';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kanvara.vercel.app'),
  title: {
    default: 'Kanvara — A complete photo editor that runs in your browser',
    template: '%s · Kanvara',
  },
  description:
    'Layers, curves, film looks, background removal, text, motion export. No watermark, no account, and your photos never leave the machine.',
  openGraph: {
    title: 'Kanvara',
    description:
      'A complete photo editor that runs in your browser. No watermark, no account, nothing uploaded.',
    url: 'https://kanvara.vercel.app',
    siteName: 'Kanvara',
    type: 'website',
  },
  icons: { icon: '/mark.svg', apple: '/mark.svg' },
  manifest: '/manifest.webmanifest',
  applicationName: 'Kanvara',
  appleWebApp: { capable: true, title: 'Kanvara', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#0b0b0d',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
