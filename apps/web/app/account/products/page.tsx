import Link from "next/link";
import { currentSession } from "../../../lib/current-session";
import { loadWorkspace } from "../../../lib/load-workspace";
import { catalogTitle } from "../../../lib/workspace-nav";
import { catalogQuery, filterCatalog, type ProductRow } from "../../../lib/workspace-view";
import { CatalogTable } from "../workspace/records";
import { WorkspaceError } from "../workspace/states";
import styles from "../workspace/dashboard.module.css";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ listing?: string; queue?: string }> }) {
  const session = await currentSession();
  if (session === null) {
    return (
      <main className="card stack">
        <h1>Products</h1>
        <p><Link href="/login">Sign in</Link> to manage products.</p>
      </main>
    );
  }
  if (!session.roles.includes("seller")) {
    return (
      <main className="card stack">
        <h1>Products</h1>
        <p>Save a <Link href="/account/seller">seller profile</Link> before creating a product.</p>
      </main>
    );
  }
  const loaded = await loadWorkspace();
  if (!loaded.ok) return <WorkspaceError reason={loaded.reason} />;
  const query = catalogQuery(await searchParams);
  const rows = filterCatalog(loaded.view.products, query);
  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <h1>{catalogTitle(query)}</h1>
          <p className={styles.lede}>Listing, latest version, and active offer. Views and sales are not collected.</p>
        </div>
        <Link className={styles.primary} href="/account/products/new">New product</Link>
      </header>
      {rows.length === 0 && loaded.view.products.length > 0 ? <p className={styles.plain}>Nothing in this view.</p> : <ProductSurface rows={rows} />}
      {loaded.view.productsCapped ? <p className={styles.note}>Showing the 50 most recently updated products.</p> : null}
    </div>
  );
}

function ProductSurface({ rows }: { rows: ProductRow[] }) {
  if (rows.length === 0) return <CatalogTable rows={rows} />;
  return (
    <section className={styles.board}>
      <CatalogTable rows={rows} />
    </section>
  );
}
