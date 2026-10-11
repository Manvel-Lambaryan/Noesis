import { loadWorkspace } from "../../../lib/load-workspace";
import { ActionCenter } from "./action-center";
import { ActivityList, ProductBoard } from "./records";
import { WorkspaceError } from "./states";
import { MetricGrid, QuickActions, SalesOverview, Welcome } from "./studio";
import page from "./dashboard.module.css";
import studio from "./studio.module.css";

export async function SellerDashboard() {
  const loaded = await loadWorkspace();
  if (!loaded.ok) return <WorkspaceError reason={loaded.reason} />;
  const view = loaded.view;
  const name = view.seller.displayName.trim();
  return (
    <div className={page.page}>
      <Welcome name={name.length > 0 ? name : "there"} />
      <MetricGrid metrics={view.metrics} />
      <div className={studio.pair}>
        <SalesOverview />
        <ActionCenter items={view.attention} hasProducts={view.metrics.totalProducts > 0} />
      </div>
      <div className={studio.pair}>
        <ProductBoard rows={view.products.slice(0, 4)} capped={view.productsCapped} />
        <ActivityList
          items={view.activity.slice(0, 6)}
          now={new Date().toISOString()}
          compact
          note={view.versionsCapped ? "Version history is limited to the 100 newest version records." : undefined}
        />
      </div>
      <QuickActions />
    </div>
  );
}
