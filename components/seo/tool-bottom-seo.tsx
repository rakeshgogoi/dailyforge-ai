import { getTool } from "@/lib/tools";

export function ToolBottomSeo({ category, slug }: { category: string; slug: string }) {
  const match = getTool(category, slug);
  if (!match) return null;
  const { tool } = match;
  if (!tool.seoIntro && !tool.faq?.length) return null;

  const faqLd =
    tool.faq && tool.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: tool.faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }
      : null;

  return (
    <section className="mt-16 border-t border-border pt-12">
      {tool.seoIntro && (
        <>
          <h2 className="text-xl font-semibold tracking-tight">
            About {tool.name}
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {tool.seoIntro}
          </p>
        </>
      )}

      {tool.faq && tool.faq.length > 0 && (
        <>
          <h2 className="text-xl font-semibold tracking-tight mt-10">
            Frequently asked questions
          </h2>
          <div className="mt-4 space-y-3">
            {tool.faq.map((item, i) => (
              <details
                key={i}
                className="border border-border rounded-lg px-4 py-3 group"
              >
                <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                  <span>{item.q}</span>
                  <span className="text-muted-foreground transition-transform group-open:rotate-45 text-lg leading-none">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
          {faqLd && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
            />
          )}
        </>
      )}
    </section>
  );
}
