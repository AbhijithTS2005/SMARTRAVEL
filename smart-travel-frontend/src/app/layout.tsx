import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import QueryProvider from '@/components/QueryProvider';
import SOSButton from '@/components/SOSButton';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: 'SmarTravel - Your Smart Travel Advisor',
  description: 'AI-powered travel recommendations with real-time environmental monitoring',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SmarTravel',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        <QueryProvider>
          <AuthProvider>
            <LanguageProvider>
              {children}
              <SOSButton />
            </LanguageProvider>
          </AuthProvider>
        </QueryProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(reg => console.log('SW registered:', reg.scope))
                    .catch(err => console.warn('SW registration failed:', err));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
