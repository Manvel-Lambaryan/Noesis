"use client";

import { useState, type FormEvent } from "react";
import { AuthFields, type AuthField } from "./auth-fields";

export function AuthForm(props: {
  action: string;
  method?: "POST" | "PUT";
  title: string;
  submitLabel: string;
  fields: AuthField[];
  successMessage: string;
  onSuccess?: () => void;
  appearance?: "plain" | "gate";
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch(props.action, {
        method: props.method ?? "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus("error");
        setMessage(readMessage(payload));
        return;
      }
      setStatus("success");
      setMessage(props.successMessage);
      props.onSuccess?.();
    } catch {
      setStatus("error");
      setMessage("The request could not be completed.");
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="card" aria-busy={status === "loading"}>
      <h1>{props.title}</h1>
      <AuthFields fields={props.fields} gate={props.appearance === "gate"} />
      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Please wait" : props.submitLabel}
      </button>
      {status === "error" ? <p className="error" role="alert">{message}</p> : null}
      {status === "success" ? <p className="success" role="status">{message}</p> : null}
    </form>
  );
}

function readMessage(payload: unknown): string {
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const message = payload.message;
    return typeof message === "string" ? message : "The request was rejected.";
  }
  return "The request was rejected.";
}
