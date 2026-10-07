import { ModulePending } from "../../workspace/states";

export const dynamic = "force-dynamic";

export default function TransactionsPage() {
  return <ModulePending kicker="Finance" title="Transactions" body="Transaction history will list sales, refunds, fees, payouts, and adjustments from the ledger. That source does not exist yet." />;
}
