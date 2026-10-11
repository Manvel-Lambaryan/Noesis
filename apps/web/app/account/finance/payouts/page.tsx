import { ModulePending } from "../../workspace/states";

export const dynamic = "force-dynamic";

export default function PayoutsPage() {
  return <ModulePending kicker="Finance" title="Payouts" body="Payout history will appear once earnings become available. No payout account is stored, and this screen cannot move money." />;
}
