import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — dailyforge·ai",
  description: "What data dailyforge·ai collects, how we use it, and your rights.",
};

const CONTACT_EMAIL = "connect@codingryder.com";

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-16 prose prose-zinc dark:prose-invert">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mt-2">Last updated: 26 June 2026</p>

      <h2 className="text-lg sm:text-xl font-semibold tracking-tight mt-10">Summary</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        dailyforge·ai is a collection of free online tools. We try to collect as little personal data as possible. Many tools run entirely in your browser and never send your files to our servers. The tools that do use external AI providers (Gemini, Groq, Sarvam, CloudConvert) only forward the input needed to produce the result, and the providers delete it after processing.
      </p>

      <h2 className="text-lg sm:text-xl font-semibold tracking-tight mt-10">What we collect</h2>

      <h3 className="text-base font-semibold tracking-tight mt-6">1. An anonymous cookie</h3>
      <p className="mt-2 text-muted-foreground leading-relaxed">
        We set a single first-party cookie named <code>df_anon</code> with a random UUID. It exists so we can rate-limit abusive use without requiring you to sign in. The cookie is HTTP-only, expires after one year, and contains no personal information.
      </p>

      <h3 className="text-base font-semibold tracking-tight mt-6">2. Account information (only if you sign in)</h3>
      <p className="mt-2 text-muted-foreground leading-relaxed">
        If you choose to sign in with Google or a magic link, we store your email address, name, and a profile image URL. Authentication is provided by Better Auth running on our server.
      </p>

      <h3 className="text-base font-semibold tracking-tight mt-6">3. Tool usage logs</h3>
      <p className="mt-2 text-muted-foreground leading-relaxed">
        Every time a tool runs successfully we record: the tool slug, your account ID (or anonymous cookie ID), and timestamps. We do <strong>not</strong> store the input files or their contents, the outputs, or the result of the AI call. Logs are kept for analytics and abuse prevention.
      </p>

      <h3 className="text-base font-semibold tracking-tight mt-6">4. Web analytics</h3>
      <p className="mt-2 text-muted-foreground leading-relaxed">
        We use Vercel Analytics and Google Analytics 4 to understand which tools are used and how visitors find us. These services receive standard request data (IP address, user agent, referrer, page URL). They use cookies and similar technologies to distinguish visitors. We do not link analytics data with your account.
      </p>

      <h3 className="text-base font-semibold tracking-tight mt-6">5. Advertising (if enabled)</h3>
      <p className="mt-2 text-muted-foreground leading-relaxed">
        Some pages may display advertising provided by Google AdSense. AdSense and its partners may use cookies and device identifiers to personalize ads. You can manage your preferences at{" "}
        <a href="https://adssettings.google.com" className="underline" target="_blank" rel="noopener noreferrer">adssettings.google.com</a>.
      </p>

      <h2 className="text-lg sm:text-xl font-semibold tracking-tight mt-10">Where your data goes</h2>
      <ul className="mt-3 text-muted-foreground leading-relaxed list-disc pl-6 space-y-2">
        <li><strong>Vercel</strong> (United States) — site hosting and analytics</li>
        <li><strong>Neon</strong> (United States) — Postgres database for accounts and logs</li>
        <li><strong>Google</strong> (Gemini AI, Analytics, AdSense, OAuth) — AI processing and traffic measurement</li>
        <li><strong>Groq</strong> — audio transcription</li>
        <li><strong>Sarvam AI</strong> — text-to-speech</li>
        <li><strong>CloudConvert</strong> — document format conversion</li>
        <li><strong>Cloudflare R2</strong> — temporary file storage for some tools</li>
      </ul>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Where required, data may be transferred outside your region (including to the US). We rely on each provider&apos;s standard contractual clauses and equivalent safeguards.
      </p>

      <h2 className="text-lg sm:text-xl font-semibold tracking-tight mt-10">What we never do</h2>
      <ul className="mt-3 text-muted-foreground leading-relaxed list-disc pl-6 space-y-2">
        <li>Sell your data to third parties.</li>
        <li>Use the content of your files or text inputs to train AI models.</li>
        <li>Retain your file contents after the tool finishes running.</li>
      </ul>

      <h2 className="text-lg sm:text-xl font-semibold tracking-tight mt-10">Your rights</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Depending on where you live (EU, UK, California, etc.) you may have the right to access, correct, export, or delete your personal data. To exercise these rights, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>{" "}
        from the address linked to your account.
      </p>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        You can clear the <code>df_anon</code> cookie at any time using your browser settings. Doing so resets your rate-limit counter.
      </p>

      <h2 className="text-lg sm:text-xl font-semibold tracking-tight mt-10">Children</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        dailyforge·ai is not directed at children under 13 (or under 16 in the EU). We do not knowingly collect data from children.
      </p>

      <h2 className="text-lg sm:text-xl font-semibold tracking-tight mt-10">Changes</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        We may update this policy as the service evolves. The &quot;Last updated&quot; date at the top reflects the most recent revision. Substantive changes will be announced on the site.
      </p>

      <h2 className="text-lg sm:text-xl font-semibold tracking-tight mt-10">Contact</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Questions or concerns? Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>.
      </p>

      <p className="mt-10 text-sm">
        <Link href="/" className="underline text-muted-foreground hover:text-foreground">← Back to home</Link>
      </p>
    </article>
  );
}
