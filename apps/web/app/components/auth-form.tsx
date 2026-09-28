"use client";

import { useState, type FormEvent } from "react";

type Field = {
  name: string;
  label: string;
  type: "email" | "password" | "text";
  autoComplete: string;
  defaultValue?: string;
  minLength?: number;
};

export function AuthForm(props: {
  action: string;
  method?: "POST" | "PUT";
  title: string;
  submitLabel: string;
  fields: Field[];
  successMessage: string;
  onSuccess?: () => void;
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
      {props.fields.map((field) => (
        <label key={field.name}>
          {field.label}
          <input
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            defaultValue={field.defaultValue}
            required
            minLength={field.minLength ?? (field.type === "password" ? 12 : undefined)}
          />
        </label>
      ))}
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
