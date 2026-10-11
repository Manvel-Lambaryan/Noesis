import { ModulePending } from "../workspace/states";

export const dynamic = "force-dynamic";

export default function LicensesPage() {
  return <ModulePending kicker="Sales" title="Licenses" body="Licenses are issued from paid orders. Entitlements are not exposed on the seller workspace yet." />;
}
