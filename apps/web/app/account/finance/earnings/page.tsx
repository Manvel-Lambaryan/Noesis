import { ModulePending } from "../../workspace/states";

export const dynamic = "force-dynamic";

export default function EarningsPage() {
  return <ModulePending kicker="Finance" title="Earnings" body="Net earnings are a ledger projection. Nothing on this page is calculated in the browser, and no sample earnings are shown." />;
}
