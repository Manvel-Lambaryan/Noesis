import { ModulePending } from "../workspace/states";

export const dynamic = "force-dynamic";

export default function InquiriesPage() {
  return <ModulePending kicker="Communication" title="Inquiries" body="Pre-sale questions are not available yet. An inquiry will belong to one of your products." />;
}
