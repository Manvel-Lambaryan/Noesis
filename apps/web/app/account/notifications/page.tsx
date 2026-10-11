import { ModulePending } from "../workspace/states";

export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  return <ModulePending kicker="Notifications" title="Notifications" body="In-app notifications are not configured. Email is already used for verification and password reset. There is no unread count to show." />;
}
