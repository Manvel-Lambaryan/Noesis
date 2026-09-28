import Link from "next/link";
import { ProductDraftForm } from "../../../components/product-draft-form";
import { currentSession } from "../../../../lib/current-session";
import { loadCategories } from "../../../../lib/marketplace";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await currentSession();
  if (session === null) {
    return (
      <main className="card stack">
        <h1>New product draft</h1>
        <p><Link href="/login">Sign in</Link> to create a draft.</p>
      </main>
    );
  }
  const categories = await loadCategories();
  return (
    <main className="stack">
      <ProductDraftForm
        mode="create"
        categories={categories}
        initial={{
          title: "",
          summary: "",
          kind: "code_asset",
          categoryId: categories[0]?.id ?? "",
          stacks: "",
          tags: "",
        }}
      />
    </main>
  );
}
