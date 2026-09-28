import { apiFetch, isRecord } from "../../../lib/api";

export const dynamic = "force-dynamic";

export default async function MailboxPage() {
  const result = await apiFetch("/v1/auth/mailbox", { method: "GET" });
  const messages = result.status === 200 && isRecord(result.body) && Array.isArray(result.body.messages)
    ? result.body.messages.filter(isRecord)
    : null;
  if (messages === null) {
    return (
      <main className="card stack">
        <h1>Local mailbox</h1>
        <p>Email delivery is not configured. Set EMAIL_PROVIDER=capture on the API for local development only.</p>
      </main>
    );
  }
  return (
    <main className="card stack">
      <h1>Local mailbox</h1>
      <p className="note">This page exists only while the capture adapter is on. It is not a production email provider.</p>
      {messages.length === 0 ? <p>No messages yet.</p> : (
        <ul>
          {messages.map((message) => (
            <li key={String(message.url)}>
              <span>{String(message.purpose)} for {String(message.to)} </span>
              {typeof message.url === "string" ? <a href={message.url}>Open link</a> : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
