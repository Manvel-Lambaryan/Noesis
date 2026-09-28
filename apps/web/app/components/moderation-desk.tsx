"use client";

import { useEffect, useState, type FormEvent } from "react";

type QueueItem = { versionId: string; title: string; versionLabel: string; structuralScan: string };
type Detail = {
  title: string;
  summary: string;
  state: string;
  structuralScan: string;
  promoted: boolean;
  scanEngine: string | null;
  scanReason: string | null;
  decisions: { id: string; action: string; note: string }[];
};

export function ModerationDesk() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selected, setSelected] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void refresh().then(setItems);
  }, []);

  async function open(versionId: string): Promise<void> {
    setSelected(versionId);
    setDetail(await readDetail(versionId));
  }

  async function decide(action: "approve" | "reject", event?: FormEvent<HTMLFormElement>): Promise<void> {
    event?.preventDefault();
    const note = event === undefined ? "" : String(new FormData(event.currentTarget).get("note") ?? "");
    setBusy(true);
    const response = await fetch(`/api/admin/versions/${selected}/decisions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    const body: unknown = await response.json().catch(() => null);
    setBusy(false);
    setMessage(response.ok ? `Recorded ${action}. Structural scan is not a malware clearance.` : errorText(body));
    setItems(await refresh());
    setDetail(await readDetail(selected));
  }

  async function takedown(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    const response = await fetch(`/api/admin/listings/${String(form.get("productId"))}/takedown`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note: String(form.get("note") ?? "") }),
    });
    const body: unknown = await response.json().catch(() => null);
    setBusy(false);
    setMessage(response.ok ? "Listing removed from discovery." : errorText(body));
  }

  return (
    <section className="stack">
      <h1>Moderation</h1>
      {items.length === 0 ? <p>No versions are waiting.</p> : null}
      {items.map((item) => (
        <button key={item.versionId} type="button" onClick={() => void open(item.versionId)}>
          {item.title} {item.versionLabel} ({item.structuralScan})
        </button>
      ))}
      {detail === null ? <p>Select a version to review metadata and the structural scan report.</p> : (
        <article className="card stack">
          <h2>{detail.title}</h2>
          <p>{detail.summary}</p>
          <p>State: {detail.state}. Promoted to private storage: {detail.promoted ? "yes" : "no"}.</p>
          <p>Structural scan: {detail.structuralScan}. Engine: {detail.scanEngine ?? "none"}. Reason: {detail.scanReason ?? "none"}.</p>
          <p className="note">A passed structural scan is not a malware-free certification. Human approval is separate.</p>
          {detail.decisions.map((item) => <p key={item.id}>{item.action}: {item.note}</p>)}
          <button type="button" disabled={busy || selected.length === 0} onClick={() => void decide("approve")}>Approve</button>
          <form onSubmit={(event) => void decide("reject", event)}>
            <label>Rejection explanation<textarea name="note" required minLength={8} /></label>
            <button type="submit" disabled={busy}>Reject</button>
          </form>
        </article>
      )}
      <form className="card stack" onSubmit={(event) => void takedown(event)}>
        <h2>Takedown</h2>
        <label>Product id<input name="productId" required /></label>
        <label>Reason<textarea name="note" required minLength={8} /></label>
        <button type="submit" disabled={busy}>Remove from discovery</button>
      </form>
      {message.length > 0 ? <p role="status">{message}</p> : null}
    </section>
  );
}

async function refresh(): Promise<QueueItem[]> {
  const response = await fetch("/api/admin/moderation/queue");
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok || typeof body !== "object" || body === null || !("items" in body) || !Array.isArray(body.items)) {
    return [];
  }
  return body.items.flatMap((item) => isItem(item) ? [item] : []);
}

async function readDetail(versionId: string): Promise<Detail | null> {
  const response = await fetch(`/api/admin/versions/${versionId}`);
  const body: unknown = await response.json().catch(() => null);
  return response.ok && isDetail(body) ? body : null;
}

function isItem(value: unknown): value is QueueItem {
  return typeof value === "object" && value !== null && "versionId" in value && "title" in value;
}

function isDetail(value: unknown): value is Detail {
  return typeof value === "object" && value !== null && "structuralScan" in value && "decisions" in value;
}

function errorText(body: unknown): string {
  return typeof body === "object" && body !== null && "message" in body && typeof body.message === "string" ? body.message : "The request failed.";
}
