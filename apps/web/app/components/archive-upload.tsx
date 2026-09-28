"use client";

import { useState, type FormEvent } from "react";

type Phase = "idle" | "uploading" | "processing" | "success" | "rejected" | "error";

export function ArchiveUpload({ productId }: { productId: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    const label = String(form.get("versionLabel") ?? "");
    if (!(file instanceof File) || file.size === 0) {
      setPhase("error");
      setMessage("Choose a zip or gzip archive.");
      return;
    }
    setPhase("uploading");
    setProgress(0);
    setMessage("");
    const result = await runUpload(productId, label, file, setProgress, setPhase);
    setPhase(result.phase);
    setMessage(result.message);
  }

  return (
    <form className="card stack" onSubmit={(event) => void onSubmit(event)}>
      <h2>Archive upload</h2>
      <label>Version<input name="versionLabel" required defaultValue="1.0.0" /></label>
      <label>Archive<input name="file" type="file" accept=".zip,.gz,application/zip,application/gzip" required /></label>
      {phase === "uploading" ? <p role="status">Uploading {progress}%</p> : null}
      {phase === "processing" ? <p role="status">Scanning the archive.</p> : null}
      {phase === "error" || phase === "rejected" ? <p className="error" role="alert">{message}</p> : null}
      {phase === "success" ? <p className="success" role="status">{message}</p> : null}
      <button type="submit" disabled={phase === "uploading" || phase === "processing"}>Upload archive</button>
      <p className="note">The archive stays in quarantine until scanning finishes. Moderation and publication are not part of this step.</p>
    </form>
  );
}

async function runUpload(
  productId: string,
  label: string,
  file: File,
  onProgress: (value: number) => void,
  onPhase: (phase: Phase) => void,
): Promise<{ phase: Phase; message: string }> {
  const versionId = await createVersion(productId, label);
  if (versionId === null) {
    return { phase: "error", message: "The version could not be created." };
  }
  const upload = await createIntent(versionId, file);
  if (upload === null) {
    return { phase: "error", message: "The upload could not be authorized." };
  }
  if (!await putArchive(upload.url, file, onProgress)) {
    return { phase: "error", message: "The archive could not be stored." };
  }
  if (!await complete(versionId, file.size)) {
    return { phase: "error", message: "The upload could not be completed." };
  }
  onPhase("processing");
  return poll(versionId);
}

async function createVersion(productId: string, versionLabel: string): Promise<string | null> {
  const response = await fetch(`/api/seller/products/${productId}/versions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ versionLabel }),
  });
  const body: unknown = await response.json().catch(() => null);
  return response.ok && isRecord(body) && typeof body.id === "string" ? body.id : null;
}

async function createIntent(versionId: string, file: File): Promise<{ url: string } | null> {
  const response = await fetch(`/api/seller/versions/${versionId}/upload-intents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contentType: contentType(file), byteSize: file.size }),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok || !isRecord(body) || !isRecord(body.upload) || typeof body.upload.url !== "string") {
    return null;
  }
  return { url: body.upload.url };
}

async function complete(versionId: string, byteSize: number): Promise<boolean> {
  const response = await fetch(`/api/seller/versions/${versionId}/complete-upload`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ byteSize }),
  });
  return response.status === 202;
}

async function poll(versionId: string): Promise<{ phase: Phase; message: string }> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await fetch(`/api/seller/versions/${versionId}`);
    const body: unknown = await response.json().catch(() => null);
    const state = isRecord(body) && typeof body.state === "string" ? body.state : "";
    if (state === "pending_moderation") {
      const sha256 = isRecord(body) && typeof body.sha256 === "string" ? body.sha256 : "";
      return { phase: "success", message: `Scan complete. Waiting for moderation. Checksum ${sha256}` };
    }
    if (state === "scan_rejected") {
      const reason = isRecord(body) && typeof body.reasonCode === "string" ? body.reasonCode : "rejected";
      return { phase: "rejected", message: `Scan rejected the archive (${reason}). It cannot be downloaded.` };
    }
    await delay(1000);
  }
  return { phase: "processing", message: "Scanning is still running." };
}

function putArchive(url: string, file: File, onProgress: (value: number) => void): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", contentType(file));
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => resolve(xhr.status === 204);
    xhr.onerror = () => resolve(false);
    xhr.send(file);
  });
}

function contentType(file: File): string {
  if (file.type === "application/zip" || file.type === "application/gzip" || file.type === "application/x-gzip") {
    return file.type;
  }
  return file.name.endsWith(".gz") ? "application/gzip" : "application/zip";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
