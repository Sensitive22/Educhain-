import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EduChain - Decentralized Academic Content Platform',
  description: 'Connect directly with educators and learners worldwide through blockchain technology. Access notes, lectures, and subscriptions in a decentralized ecosystem.',
  keywords: 'education, blockchain, decentralized, learning, teachers, students, academic content',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}