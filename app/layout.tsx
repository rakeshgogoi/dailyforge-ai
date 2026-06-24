import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dailyforge AI — everyday tools, powered by AI",
  description: "Convert documents, edit images, transcribe audio and video. One platform for your daily AI utilities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight">
              dailyforge<span className="text-orange-500">·</span>ai
            </Link>
            <nav className="flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
              <Link href="/#documents" className="hover:text-zinc-900 dark:hover:text-zinc-100">Documents</Link>
              <Link href="/#images" className="hover:text-zinc-900 dark:hover:text-zinc-100">Images</Link>
              <Link href="/#audio-video" className="hover:text-zinc-900 dark:hover:text-zinc-100">Audio & Video</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-16">
          <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-zinc-500 flex items-center justify-between">
            <span>© {new Date().getFullYear()} dailyforge·ai</span>
            <span>Built for the daily grind.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
