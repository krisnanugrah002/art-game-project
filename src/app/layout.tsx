import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import AuthProvider from '@/components/providers/AuthProvider';

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "ArtMastery",
  description: "Platform Edukasi Seni Rupa Interaktif",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${nunito.variable} antialiased selection:bg-purple-200 selection:text-purple-900`}>
      <body className="bg-slate-50 text-slate-800 min-h-screen flex flex-col font-sans pb-28 md:pb-12">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
