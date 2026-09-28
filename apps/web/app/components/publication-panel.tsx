"use client";

import { useEffect, useState, type FormEvent } from "react";

type Review = {
  listingState: string;
  appeal: { state: string; note: string } | null;
  versions: { id: string; versionLabel: string; state: string; reasonCode: string | null; promoted: boolean; structuralScan: string; sha256: string | null }[];
  decisions: { id: string; action: string; note: string }[];
};

export function PublicationPanel({ productId }: { productId: string }) {
  const [review, setReview] = useState<Review | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void load(productId).then(setReview);
  }, [productId]);

  async function publish(): Promise<void> {
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/seller/products/${productId}/publish`, { method: "POST" });
    const body: unknown = await response.json().catch(() => null);
    setBusy(false);
    setMessage(response.ok ? "The product is public." : errorText(body));
    setReview(await load(productId));
  }

  async function appeal(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const note = String(new FormData(event.currentTarget).get("note") ?? "");
    setBusy(true);
    const response = await fetch(`/api/seller/listings/${productId}/appeals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note }),
    });
    const body: unknown = await response.json().catch(() => null);
    setBusy(false);
    setMessage(response.ok ? "Appeal submitted." : errorText(body));
    setReview(await load(productId));
  }

  if (review === null) {
    return <section className="card stack"><h2>Publication</h2><p>Loading review status.</p></section>;
  }
  return (
    <section className="card stack">
      <h2>Publication</h2>
      <p>Listing: {review.listingState}</p>
      {review.versions.map((version) => (
        <article key={version.id}>
          <p>{version.versionLabel}: {version.state}</p>
          <p className="note">Structural scan: {version.structuralScan}. Promoted: {version.promoted ? "yes" : "no"}. Human decision is separate from the structural scan.</p>
          {version.reasonCode !== null ? <p className="error">Outcome: {version.reasonCode}</p> : null}
          {version.sha256 !== null ? <p className="note">Checksum {version.sha256}</p> : null}
        </article>
      ))}
      {review.decisions.filter((item) => item.action === "reject").map((item) => (
        <p className="error" key={item.id}>Rejection: {item.note}</p>
      ))}
      {review.appeal !== null ? <p>Appeal: {review.appeal.state}</p> : null}
      <button type="button" disabled={busy} onClick={() => void publish()}>Publish</button>
      {review.listingState === "taken_down" && review.appeal === null ? (
        <form onSubmit={(event) => void appeal(event)}>
          <label>Appeal note<textarea name="note" required minLength={8} /></label>
          <button type="submit" disabled={busy}>Submit appeal</button>
        </form>
      ) : null}
      {message.length > 0 ? <p role="status">{message}</p> : null}
    </section>
  );
}

async function load(productId: string): Promise<Review | null> {
  const response = await fetch(`/api/seller/products/${productId}/review`);
  const body: unknown = await response.json().catch(() => null);
  return response.ok && isReview(body) ? body : null;
}

function isReview(value: unknown): value is Review {
  return typeof value === "object" && value !== null && "listingState" in value && "versions" in value;
}

function errorText(body: unknown): string {
  return typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
    ? body.message
    : "The request failed.";
}
