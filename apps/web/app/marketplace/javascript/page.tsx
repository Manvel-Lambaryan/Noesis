import type { Metadata } from "next";
import { ListingBrowse } from "../browse";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "JavaScript and TypeScript · NOESIS",
  description: "Products whose technology stack includes JavaScript or TypeScript.",
};

export default function JavascriptMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ListingBrowse
      view="javascript"
      pathname="/marketplace/javascript"
      title="JavaScript and TypeScript"
      intro="The same catalog, limited to products that list JavaScript or TypeScript."
      searchParams={searchParams}
    />
  );
}
