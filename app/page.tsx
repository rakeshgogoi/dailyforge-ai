import Link from "next/link";
import { CATEGORIES } from "@/lib/tools";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <section className="py-20 sm:py-28 text-center">
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight">
          Everyday tools,
          <br />
          <span className="text-orange-500">forged with AI.</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
          Convert documents, clean up images, transcribe audio and video — and a few dozen other
          things you used to need ten different sites for. All in one place.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 text-sm">
          <Button asChild size="lg" className="rounded-full">
            <Link href="#documents">Browse tools</Link>
          </Button>
          <span className="text-muted-foreground">No signup for the basics.</span>
        </div>
      </section>

      {CATEGORIES.map((category) => (
        <section key={category.slug} id={category.slug} className="py-12 scroll-mt-20">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{category.name}</h2>
              <p className="text-muted-foreground text-sm mt-1">{category.tagline}</p>
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {category.tools.length} tools
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {category.tools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${category.slug}/${tool.slug}`}
                className="group focus:outline-none"
              >
                <Card className="h-full transition-colors hover:ring-orange-500/40 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                  <CardHeader>
                    <CardTitle className="group-hover:text-orange-600 dark:group-hover:text-orange-400">
                      {tool.name}
                    </CardTitle>
                    <CardDescription>{tool.blurb}</CardDescription>
                    {tool.status === "soon" && (
                      <CardAction>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded-full px-2 py-0.5">
                          Soon
                        </span>
                      </CardAction>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
