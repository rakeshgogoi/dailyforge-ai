import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { Toaster } from "@/components/ui/sonner";
import { SITE_URL } from "@/lib/seo";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const SEARCH_CONSOLE = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_TITLE = "Dailyforge AI — everyday tools, powered by AI";
const SITE_DESCRIPTION =
  "Convert documents, edit images, transcribe audio and video, and more — 22+ free AI tools, all in one place.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s",
  },
  description: SITE_DESCRIPTION,
  applicationName: "dailyforge·ai",
  keywords: [
    "AI tools",
    "PDF converter",
    "OCR",
    "image background remover",
    "transcribe audio",
    "subtitle generator",
    "text to speech",
    "summarize URL",
    "merge PDF",
    "compress PDF",
    "resume builder",
    "translate text",
    "free online tools",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "dailyforge·ai",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  verification: SEARCH_CONSOLE ? { google: SEARCH_CONSOLE } : undefined,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="border-b border-border bg-header sticky top-0 z-10">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
              <Link href="/" className="font-semibold tracking-tight">
                dailyforge<span className="text-orange-500">·</span>ai
              </Link>
              <nav className="flex items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
                <Link href="/#documents" className="hidden sm:inline hover:text-foreground">Documents</Link>
                <Link href="/#images" className="hidden sm:inline hover:text-foreground">Images</Link>
                <Link href="/#audio-video" className="hidden sm:inline hover:text-foreground">Audio & Video</Link>
                <Link href="/#documents" className="sm:hidden hover:text-foreground" aria-label="Browse tools">Tools</Link>
                <ThemeToggle />
                <UserMenu />
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border mt-12 sm:mt-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 text-sm text-muted-foreground flex flex-col sm:flex-row gap-1 sm:gap-0 items-center sm:justify-between">
              <span>© {new Date().getFullYear()} dailyforge·ai</span>
              <span>Built for the daily grind.</span>
            </div>
          </footer>
          <Toaster />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_ID}', { send_page_view: true });`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
