import type { Metadata } from "next";
import { ListingBrowse } from "./browse";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Marketplace · NOESIS",
  description: "Browse the general NOESIS catalog.",
};

export default function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ListingBrowse
      view="general"
      pathname="/marketplace"
      title="Marketplace"
      intro="Every published product in the one catalog."
      searchParams={searchParams}
    />
  );
}
