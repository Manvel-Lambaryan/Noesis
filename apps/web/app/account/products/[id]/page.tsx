import Link from "next/link";
import { ArchiveUpload } from "../../../components/archive-upload";
import { PublicationPanel } from "../../../components/publication-panel";
import { PreviewUpload, ProductDraftForm } from "../../../components/product-draft-form";
import { currentSession } from "../../../../lib/current-session";
import { loadCategories, loadOwnProduct } from "../../../../lib/marketplace";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await currentSession();
  const { id } = await params;
  if (session === null) {
    return (
      <main className="card stack">
        <h1>Product draft</h1>
        <p><Link href="/login">Sign in</Link> to edit a draft.</p>
      </main>
    );
  }
  const [product, categories] = await Promise.all([loadOwnProduct(id), loadCategories()]);
  if (product === null) {
    return (
      <main className="card stack">
        <h1>Product not available</h1>
        <p>This draft does not exist or belongs to another seller.</p>
        <p><Link href="/account/products">Your drafts</Link></p>
      </main>
    );
  }
  return (
    <main className="stack">
      <ProductDraftForm
        mode="edit"
        productId={product.id}
        categories={categories}
        initial={{
          title: product.title,
          summary: product.summary,
          kind: product.kind,
          categoryId: product.categoryId,
          stacks: product.stacks.join(", "),
          tags: product.tags.join(", "),
        }}
      />
      <PreviewUpload productId={product.id} />
      <ArchiveUpload productId={product.id} />
      <PublicationPanel productId={product.id} />
      {product.previews.map((preview) => (
        <img key={preview.id} src={preview.url} alt="" />
      ))}
    </main>
  );
}
