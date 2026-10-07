import { ModulePending } from "../workspace/states";

export const dynamic = "force-dynamic";

export default function InboxPage() {
  return <ModulePending kicker="Communication" title="Messages" body="Buyer messages are not available yet. A message will stay attached to a product, order, or inquiry rather than becoming a generic chat." />;
}
