import type { Metadata } from "next";
import { ListingBrowse } from "../browse";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Business applications · NOESIS",
  description: "Ready-to-launch business applications from the same catalog.",
};

export default function BusinessMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ListingBrowse
      view="business_apps"
      pathname="/marketplace/business-apps"
      title="Business applications"
      intro="Products classified as business applications. They are not stored in a second catalog."
      searchParams={searchParams}
    />
  );
}
