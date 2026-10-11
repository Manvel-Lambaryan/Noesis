import { loadWorkspace } from "../../../lib/load-workspace";
import { filterActivity } from "../../../lib/workspace-view";
import { ActivityList } from "../workspace/records";
import { WorkspaceError } from "../workspace/states";
import styles from "../workspace/dashboard.module.css";

export const dynamic = "force-dynamic";

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const loaded = await loadWorkspace();
  if (!loaded.ok) return <WorkspaceError reason={loaded.reason} />;
  const kind = (await searchParams).kind;
  const title = kind === "version" ? "Moderation history" : kind === "catalog" ? "Product activity" : "History";
  return (
    <div className={styles.page}>
      <header>
        <h1>{title}</h1>
        <p className={styles.lede}>Recent catalog and version records for this seller. Orders, payouts, and appeals are not folded in yet.</p>
      </header>
      <ActivityList
        items={filterActivity(loaded.view.activity, kind)}
        now={new Date().toISOString()}
        note={loaded.view.versionsCapped ? "Version history is limited to the 100 newest version records." : undefined}
      />
    </div>
  );
}
