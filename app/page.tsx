import Link from "next/link";
import { CATEGORIES } from "@/lib/tools";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <section className="py-20 sm:py-28 text-center">
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight">
          Everyday tools,
          <br />
          <span className="text-orange-500">forged with AI.</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-zinc-600 dark:text-zinc-400">
          Convert documents, clean up images, transcribe audio and video — and a few dozen other
          things you used to need ten different sites for. All in one place.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 text-sm">
          <Link
            href="#documents"
            className="rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-5 h-10 inline-flex items-center hover:opacity-90"
          >
            Browse tools
          </Link>
          <span className="text-zinc-500">No signup for the basics.</span>
        </div>
      </section>

      {CATEGORIES.map((category) => (
        <section key={category.slug} id={category.slug} className="py-12 scroll-mt-20">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{category.name}</h2>
              <p className="text-zinc-500 text-sm mt-1">{category.tagline}</p>
            </div>
            <span className="text-xs text-zinc-400 uppercase tracking-wider">
              {category.tools.length} tools
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {category.tools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${category.slug}/${tool.slug}`}
                className="group rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-orange-400 dark:hover:border-orange-500 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium group-hover:text-orange-600 dark:group-hover:text-orange-400">
                    {tool.name}
                  </h3>
                  {tool.status === "soon" && (
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-full px-2 py-0.5">
                      Soon
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-500 leading-snug">{tool.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
