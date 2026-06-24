import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="border-b border-border bg-background/70 backdrop-blur sticky top-0 z-10">
            <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
              <Link href="/" className="font-semibold tracking-tight">
                dailyforge<span className="text-orange-500">·</span>ai
              </Link>
              <nav className="flex items-center gap-6 text-sm text-muted-foreground">
                <Link href="/#documents" className="hover:text-foreground">Documents</Link>
                <Link href="/#images" className="hover:text-foreground">Images</Link>
                <Link href="/#audio-video" className="hover:text-foreground">Audio & Video</Link>
                <ThemeToggle />
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border mt-16">
            <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground flex items-center justify-between">
              <span>© {new Date().getFullYear()} dailyforge·ai</span>
              <span>Built for the daily grind.</span>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
