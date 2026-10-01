import type { Metadata } from "next";
import { loadCategories } from "../../../../lib/marketplace";
import { ListingBrowse } from "../../browse";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = (await loadCategories()).find((item) => item.slug === slug);
  const name = category?.name ?? "Category";
  return { title: `${name} · NOESIS`, description: `Published products in ${name}.` };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const category = (await loadCategories()).find((item) => item.slug === slug);
  return (
    <ListingBrowse
      view="general"
      pathname={`/marketplace/categories/${slug}`}
      title={category?.name ?? "Category"}
      intro="Published products in this category."
      searchParams={searchParams}
      category={slug}
    />
  );
}
