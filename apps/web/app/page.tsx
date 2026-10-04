import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HomeHero } from "./home/home-hero";
import { FEATURED_FALLBACK, fromListings } from "./home/featured-products";
import { ExploreCategories } from "./home/explore-categories";
import { loadCategories, loadListings } from "../lib/marketplace";
import { ENTERED_COOKIE, onboardingRedirect } from "../lib/onboarding";
import { SESSION_COOKIE } from "../lib/session-cookie";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const registered = typeof token === "string" && token.length > 0;
  const entered = jar.get(ENTERED_COOKIE)?.value === "1";
  const target = onboardingRedirect("/", { registered, entered, joined: false });
  if (target !== null) {
    redirect(target);
  }

  const [listings, categories] = await Promise.all([
    loadListings(new URLSearchParams({ view: "general" })),
    loadCategories(),
  ]);
  const products = listings.items.length > 0 ? fromListings(listings.items) : FEATURED_FALLBACK;
  return (
    <>
      <HomeHero products={products} />
      <ExploreCategories categories={categories} />
    </>
  );
}
