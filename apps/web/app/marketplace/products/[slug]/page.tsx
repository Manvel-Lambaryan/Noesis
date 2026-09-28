import type { Metadata } from "next";
import Link from "next/link";
import { loadListing } from "../../../../lib/marketplace";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await loadListing((await params).slug);
  if (product === null) {
    return { title: "Product · NOESIS", description: "This product is not public." };
  }
  return { title: `${product.title} · NOESIS`, description: product.summary.slice(0, 160) || product.title };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await loadListing((await params).slug);
  if (product === null) {
    return (
      <main className="card stack">
        <h1>Product not available</h1>
        <p>Drafts and unpublished products are not shown here.</p>
        <p><Link href="/marketplace">Back to the marketplace</Link></p>
      </main>
    );
  }
  return (
    <main className="stack">
      <p><Link href="/marketplace">Marketplace</Link></p>
      <article className="card stack">
        {product.previewUrl !== null ? <img src={product.previewUrl} alt="" /> : null}
        <h1>{product.title}</h1>
        <p className="note">{product.kind === "business_application" ? "Business application" : "Code asset"} · {product.categoryName}</p>
        <p>{product.summary}</p>
        <p className="note">Technologies: {product.stacks.join(", ") || "None listed"}</p>
        <p className="note">Tags: {product.tags.join(", ") || "None listed"}</p>
        <p>{product.price === null ? "No public price." : `${product.price.amountMinor} ${product.price.currency} minor units`}</p>
        <p className="note">License code: {product.licenseSummary ?? "not set"}. Update policy: {product.updatePolicy ?? "not set"}.</p>
        {product.demoUrl !== null ? <p><a href={product.demoUrl} target="_blank" rel="noreferrer">External demo</a></p> : null}
        <p className="note">Checkout is not available. This page does not start a payment.</p>
      </article>
    </main>
  );
}
