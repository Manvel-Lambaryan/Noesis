import { ModulePending } from "../workspace/states";

export const dynamic = "force-dynamic";

export default function CustomersPage() {
  return <ModulePending kicker="Sales" title="Customers" body="A seller can see a customer only after a purchase, message, inquiry, or call. That seller-safe projection does not exist yet, so no buyer directory is shown." />;
}
