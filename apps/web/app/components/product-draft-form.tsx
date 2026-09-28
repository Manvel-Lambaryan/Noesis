"use client";

import { useState, type FormEvent } from "react";
import type { CategoryOption } from "../../lib/marketplace";

type DraftFields = {
  title: string;
  summary: string;
  kind: string;
  categoryId: string;
  stacks: string;
  tags: string;
};

export function ProductDraftForm(props: {
  mode: "create" | "edit";
  productId?: string;
  categories: CategoryOption[];
  initial: DraftFields;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("loading");
    setMessage("");
    const response = await fetch(props.mode === "create" ? "/api/seller/products" : `/api/seller/products/${props.productId}`, {
      method: props.mode === "create" ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload(form)),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || body === null || typeof body !== "object" || !("id" in body) || typeof body.id !== "string") {
      setStatus("error");
      setMessage(errorText(body));
      return;
    }
    if (props.mode === "create") {
      window.location.assign(`/account/products/${body.id}`);
      return;
    }
    setStatus("success");
    setMessage("Draft saved. It is still private.");
  }

  return (
    <form className="card stack" onSubmit={(event) => void onSubmit(event)}>
      <h1>{props.mode === "create" ? "New product draft" : "Edit product draft"}</h1>
      <label>Name<input name="title" required minLength={2} maxLength={120} defaultValue={props.initial.title} /></label>
      <label>Description<textarea name="summary" maxLength={4000} defaultValue={props.initial.summary} /></label>
      <label>
        Product type
        <select name="kind" defaultValue={props.initial.kind}>
          <option value="code_asset">Code asset</option>
          <option value="business_application">Business application</option>
        </select>
      </label>
      <label>
        Category
        <select name="categoryId" defaultValue={props.initial.categoryId} required>
          {props.categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </label>
      <label>Technologies<input name="stacks" defaultValue={props.initial.stacks} placeholder="typescript, javascript" /></label>
      <label>Tags<input name="tags" defaultValue={props.initial.tags} placeholder="billing, admin" /></label>
      <button type="submit" disabled={status === "loading"}>{status === "loading" ? "Please wait" : "Save draft"}</button>
      {status === "error" ? <p className="error" role="alert">{message}</p> : null}
      {status === "success" ? <p className="success" role="status">{message}</p> : null}
      <p className="note">Publication is not available yet. Email verification and seller verification will be required before a listing can go public.</p>
    </form>
  );
}

export function PreviewUpload({ productId }: { productId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("file");
    if (!(file instanceof File) || file.size === 0) {
      setStatus("error");
      setMessage("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    setStatus("loading");
    setMessage("");
    const dataBase64 = await fileToBase64(file);
    const intent = await fetch(`/api/seller/products/${productId}/preview-intents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contentType: file.type, byteSize: file.size }),
    });
    const intentBody: unknown = await intent.json().catch(() => null);
    const intentId = isIntent(intentBody) ? intentBody.intentId : "";
    if (!intent.ok || intentId.length === 0) {
      setStatus("error");
      setMessage(errorText(intentBody));
      return;
    }
    const stored = await fetch(`/api/seller/products/${productId}/previews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intentId, dataBase64 }),
    });
    const storedBody: unknown = await stored.json().catch(() => null);
    if (!stored.ok) {
      setStatus("error");
      setMessage(errorText(storedBody));
      return;
    }
    setStatus("success");
    setMessage("Preview image saved.");
    window.location.reload();
  }

  return (
    <form className="card stack" onSubmit={(event) => void onSubmit(event)}>
      <h2>Preview image</h2>
      <label>Image<input name="file" type="file" accept="image/png,image/jpeg,image/webp" required /></label>
      <button type="submit" disabled={status === "loading"}>{status === "loading" ? "Please wait" : "Upload preview"}</button>
      {status === "error" ? <p className="error" role="alert">{message}</p> : null}
      {status === "success" ? <p className="success" role="status">{message}</p> : null}
    </form>
  );
}

function payload(form: FormData) {
  return {
    title: String(form.get("title") ?? ""),
    summary: String(form.get("summary") ?? ""),
    kind: String(form.get("kind") ?? ""),
    categoryId: String(form.get("categoryId") ?? ""),
    stacks: codes(form.get("stacks")),
    tags: codes(form.get("tags")),
  };
}

function codes(value: FormDataEntryValue | null): string[] {
  return typeof value === "string" ? value.split(",").map((item) => item.trim()).filter((item) => item.length > 0) : [];
}

function errorText(body: unknown): string {
  return typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
    ? body.message
    : "The draft could not be saved.";
}

function isIntent(value: unknown): value is { intentId: string } {
  return typeof value === "object" && value !== null && "intentId" in value && typeof value.intentId === "string";
}

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}
