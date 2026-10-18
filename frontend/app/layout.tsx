import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'FasalSakshi - Farm Evidence & Smart Insurance Claim Platform',
  description:
    'Autonomous farm telemetry, cryptographic visual evidence chain, and automated PMFBY crop insurance claim dossiers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-stone-50 font-sans antialiased text-stone-900 selection:bg-agri-200 selection:text-agri-950">
        <LanguageProvider>
          <Header />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
