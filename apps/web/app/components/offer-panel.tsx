"use client";

import { useEffect, useState, type FormEvent } from "react";

type Offer = {
  offerId: string;
  amountMinor: string;
  currency: string;
  licenseCode: string | null;
  licenseTextId: string | null;
  updatePolicy: string | null;
  demoUrl: string | null;
  state: string;
  versionId: string;
  createdAt: string;
};
type Version = { id: string; versionLabel: string; promoted: boolean };

export function OfferPanel({ productId }: { productId: string }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void refresh(productId).then((loaded) => {
      setOffers(loaded.offers);
      setVersions(loaded.versions);
    });
  }, [productId]);

  async function create(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    const response = await fetch(`/api/seller/products/${productId}/offers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        versionId: String(form.get("versionId") ?? ""),
        amountMinor: String(form.get("amountMinor") ?? ""),
        currency: String(form.get("currency") ?? ""),
        licenseCode: String(form.get("licenseCode") ?? ""),
        licenseTextId: String(form.get("licenseTextId") ?? ""),
        updatePolicy: String(form.get("updatePolicy") ?? ""),
        demoUrl: String(form.get("demoUrl") ?? ""),
      }),
    });
    const body: unknown = await response.json().catch(() => null);
    setBusy(false);
    setMessage(response.ok ? "A new offer was recorded. The previous offer was not rewritten." : errorText(body));
    const loaded = await refresh(productId);
    setOffers(loaded.offers);
  }

  async function archive(offerId: string): Promise<void> {
    setBusy(true);
    const response = await fetch(`/api/seller/offers/${offerId}/archive`, { method: "POST" });
    const body: unknown = await response.json().catch(() => null);
    setBusy(false);
    setMessage(response.ok ? "The active offer was archived." : errorText(body));
    const loaded = await refresh(productId);
    setOffers(loaded.offers);
  }

  const promoted = versions.filter((version) => version.promoted);
  return (
    <section className="card stack">
      <h2>Offers</h2>
      <p className="note">Prices are whole minor units. Currency policy and license text are not approved yet. Checkout is not available.</p>
      {offers.length === 0 ? <p>No offers yet.</p> : null}
      {offers.map((offer) => (
        <article key={offer.offerId}>
          <p>{offer.amountMinor} {offer.currency} · {offer.state}</p>
          <p className="note">License code: {offer.licenseCode ?? "not set"}. Update policy: {offer.updatePolicy ?? "not set"}.</p>
          {offer.demoUrl !== null ? <p className="note">Demo link stored. It is not fetched by the server.</p> : null}
          {offer.state === "active" ? <button type="button" disabled={busy} onClick={() => void archive(offer.offerId)}>Archive</button> : null}
        </article>
      ))}
      <form className="stack" onSubmit={(event) => void create(event)}>
        <label>Promoted version
          <select name="versionId" required>
            {promoted.map((version) => <option key={version.id} value={version.id}>{version.versionLabel}</option>)}
          </select>
        </label>
        <label>Amount in minor units<input name="amountMinor" required inputMode="numeric" pattern="[0-9]+" /></label>
        <label>Currency code<input name="currency" required maxLength={3} placeholder="USD" /></label>
        <label>License code<input name="licenseCode" placeholder="optional" /></label>
        <label>License text id<input name="licenseTextId" placeholder="optional UUID" /></label>
        <label>Update policy
          <select name="updatePolicy" defaultValue="">
            <option value="">Not set</option>
            <option value="exact_version">exact_version</option>
            <option value="major_line">major_line</option>
            <option value="all_future">all_future</option>
          </select>
        </label>
        <label>External demo URL<input name="demoUrl" placeholder="https://" /></label>
        <button type="submit" disabled={busy || promoted.length === 0}>Save new offer</button>
      </form>
      {message.length > 0 ? <p role="status">{message}</p> : null}
    </section>
  );
}

async function refresh(productId: string): Promise<{ offers: Offer[]; versions: Version[] }> {
  const [offerResponse, reviewResponse] = await Promise.all([
    fetch(`/api/seller/products/${productId}/offers`),
    fetch(`/api/seller/products/${productId}/review`),
  ]);
  const offerBody: unknown = await offerResponse.json().catch(() => null);
  const reviewBody: unknown = await reviewResponse.json().catch(() => null);
  return { offers: offersFrom(offerBody), versions: versionsFrom(reviewBody) };
}

function offersFrom(body: unknown): Offer[] {
  if (typeof body !== "object" || body === null || !("offers" in body) || !Array.isArray(body.offers)) {
    return [];
  }
  return body.offers.flatMap((item) => isOffer(item) ? [item] : []);
}

function versionsFrom(body: unknown): Version[] {
  if (typeof body !== "object" || body === null || !("versions" in body) || !Array.isArray(body.versions)) {
    return [];
  }
  return body.versions.flatMap((item) => isVersion(item) ? [item] : []);
}

function isOffer(value: unknown): value is Offer {
  return typeof value === "object" && value !== null && "offerId" in value && "amountMinor" in value;
}

function isVersion(value: unknown): value is Version {
  return typeof value === "object" && value !== null && "id" in value && "promoted" in value;
}

function errorText(body: unknown): string {
  return typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
    ? body.message
    : "The request failed.";
}
