import { ModulePending } from "../workspace/states";

export const dynamic = "force-dynamic";

export default function CallsPage() {
  return <ModulePending kicker="Communication" title="Calls and meetings" body="Scheduling is not available yet. A future meeting record will sit behind a provider port, so this screen cannot join a call." />;
}
