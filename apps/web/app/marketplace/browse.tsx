import Link from "next/link";
import { ListingFilters } from "../components/listing-filters";
import { loadCategories, loadListings, type ListingCard } from "../../lib/marketplace";

type Search = Record<string, string | string[] | undefined>;

export async function ListingBrowse(props: {
  view: "general" | "javascript" | "business_apps";
  pathname: string;
  title: string;
  intro: string;
  searchParams: Promise<Search>;
  category?: string;
}) {
  const query = await props.searchParams;
  const category = props.category ?? one(query.category);
  const params = new URLSearchParams({ view: props.view });
  copy(params, "q", one(query.q));
  copy(params, "kind", one(query.kind));
  copy(params, "stack", one(query.stack));
  copy(params, "category", category);
  const [listings, categories] = await Promise.all([loadListings(params), loadCategories()]);
  return (
    <main className="catalog-page stack">
      <h1>{props.title}</h1>
      <p className="note">{props.intro}</p>
      <p>
        <Link href="/marketplace">General</Link>
        {" · "}
        <Link href="/marketplace/javascript">JavaScript / TypeScript</Link>
        {" · "}
        <Link href="/marketplace/business-apps">Business applications</Link>
      </p>
      <ListingFilters
        pathname={props.pathname}
        categories={categories}
        q={one(query.q)}
        kind={one(query.kind)}
        stack={one(query.stack)}
        category={category}
        lockCategory={props.category !== undefined}
      />
      {listings.error !== null ? <p className="error" role="alert">{listings.error}</p> : null}
      {listings.items.length === 0 ? <p className="note">No published products match these filters. Seller drafts stay private.</p> : null}
      <section className="catalog-grid">
        {listings.items.map((item) => <ListingCardView key={item.productId} item={item} />)}
      </section>
    </main>
  );
}

function ListingCardView({ item }: { item: ListingCard }) {
  return (
    <article className="card stack">
      {item.previewUrl !== null ? <img src={item.previewUrl} alt="" /> : null}
      <h2><Link href={`/marketplace/products/${item.slug}`}>{item.title}</Link></h2>
      <p className="note">{labelKind(item.kind)} · {item.categoryName}</p>
      <p>{item.summary}</p>
      <p className="note">{item.stacks.join(", ")}</p>
    </article>
  );
}

function labelKind(kind: string): string {
  return kind === "business_application" ? "Business application" : "Code asset";
}

function one(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;
  return first ?? "";
}

function copy(params: URLSearchParams, key: string, value: string): void {
  if (value.length > 0) {
    params.set(key, value);
  }
}
