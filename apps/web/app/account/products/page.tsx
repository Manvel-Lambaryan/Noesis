import Link from "next/link";
import { currentSession } from "../../../lib/current-session";
import { loadOwnProducts } from "../../../lib/marketplace";

export const dynamic = "force-dynamic";

export default async function ProductDraftsPage() {
  const session = await currentSession();
  if (session === null) {
    return (
      <main className="card stack">
        <h1>Product drafts</h1>
        <p><Link href="/login">Sign in</Link> to manage drafts.</p>
      </main>
    );
  }
  const products = session.roles.includes("seller") ? await loadOwnProducts() : [];
  return (
    <main className="stack">
      <h1>Product drafts</h1>
      {session.roles.includes("seller") ? null : (
        <p className="note">Save a <Link href="/account/seller">seller profile</Link> before creating a product. Publication also requires a verified seller and a promoted archive.</p>
      )}
      <p><Link href="/account/products/new">New draft</Link></p>
      {products.length === 0 ? <p className="note">No drafts yet.</p> : null}
      <div className="stack">
        {products.map((product) => (
          <article className="card" key={product.id}>
            <h2><Link href={`/account/products/${product.id}`}>{product.title}</Link></h2>
            <p className="note">{product.listingState} · {product.kind}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
