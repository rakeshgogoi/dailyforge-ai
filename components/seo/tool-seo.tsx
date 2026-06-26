import { toolJsonLd } from "@/lib/seo";
import { TrackToolView } from "./track-tool-view";

export function ToolSeo({ category, slug }: { category: string; slug: string }) {
  const ld = toolJsonLd(category, slug);
  return (
    <>
      {ld && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      )}
      <TrackToolView category={category} slug={slug} />
    </>
  );
}
