import { ModulePending } from "../workspace/states";

export const dynamic = "force-dynamic";

export default function FinancePage() {
  return <ModulePending kicker="Finance" title="Overview" body="Gross sales, fees, refunds, net earnings, and balances must come from the ledger. There is no ledger yet, so no amounts are shown." />;
}
