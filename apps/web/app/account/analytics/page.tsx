import { ModulePending } from "../workspace/states";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const view = (await searchParams).view;
  const title = view === "products" ? "Product analytics" : view === "traffic" ? "Traffic" : "Analytics";
  return <ModulePending kicker="Analytics" title={title} body="Views, visitors, conversion, and revenue charts are not collected. This page does not show sample charts." />;
}
