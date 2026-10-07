import { ModulePending } from "../workspace/states";

export const dynamic = "force-dynamic";

export default function SalesPage() {
  return <ModulePending kicker="Sales" title="Orders" body="Your orders will appear here after your first sale. Checkout and the order ledger are not part of this workspace yet, so this list stays empty." />;
}
