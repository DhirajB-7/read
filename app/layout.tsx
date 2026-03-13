import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BookNest — Premium Book Rental',
  description: 'Rent premium books delivered to your door. India\'s finest subscription book rental service.',
  keywords: 'book rental, subscription, books, reading, India',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
