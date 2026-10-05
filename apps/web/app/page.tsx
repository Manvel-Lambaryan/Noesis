import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Fraunces } from "next/font/google";
import { HomeHero } from "./home/home-hero";
import { FEATURED_FALLBACK, fromListings, launchProducts, trendingProducts } from "./home/featured-products";
import { ExploreCategories } from "./home/explore-categories";
import { ReadyToLaunch } from "./home/ready-to-launch";
import { TrendingProducts } from "./home/trending-products";
import { WhyNoesis } from "./home/why-noesis";
import { AudienceSplit } from "./home/audience-split";
import { FinalCta } from "./home/final-cta";
import { HomeScroll } from "./home/home-scroll";
import { loadCategories, loadListings } from "../lib/marketplace";
import { ENTERED_COOKIE, onboardingRedirect } from "../lib/onboarding";
import { SESSION_COOKIE } from "../lib/session-cookie";

const display = Fraunces({ subsets: ["latin"], axes: ["SOFT", "WONK", "opsz"], variable: "--font-display" });

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
    <main className={`home-stage ${display.variable}`}>
      <HomeScroll />
      <HomeHero products={products} />
      <ExploreCategories categories={categories} />
      <ReadyToLaunch products={launchProducts(products)} />
      <TrendingProducts products={trendingProducts(products)} />
      <WhyNoesis />
      <AudienceSplit />
      <FinalCta />
    </main>
  );
}
