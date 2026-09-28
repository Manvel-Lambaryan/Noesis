import Link from "next/link";
import { ModerationDesk } from "../../components/moderation-desk";
import { currentSession } from "../../../lib/current-session";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const session = await currentSession();
  if (session === null || !session.permissions.includes("moderation")) {
    return (
      <main className="card stack">
        <h1>Moderation</h1>
        <p>You do not have the moderation permission.</p>
        <p><Link href="/account">Account</Link></p>
      </main>
    );
  }
  return (
    <main>
      <ModerationDesk />
    </main>
  );
}
