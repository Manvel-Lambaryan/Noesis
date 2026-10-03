"use client";

import { useState } from "react";
import styles from "./auth-fields.module.css";

export type AuthField = {
  name: string;
  label: string;
  type: "email" | "password" | "text";
  autoComplete: string;
  defaultValue?: string;
  minLength?: number;
  placeholder?: string;
};

export function AuthFields({ fields, gate }: { fields: AuthField[]; gate: boolean }) {
  return (
    <>
      {fields.map((field) => (
        <AuthControl key={field.name} field={field} gate={gate} />
      ))}
    </>
  );
}

function AuthControl({ field, gate }: { field: AuthField; gate: boolean }) {
  const [visible, setVisible] = useState(false);
  const type = field.type === "password" && visible ? "text" : field.type;
  return (
    <label className={gate ? styles.field : undefined}>
      {gate ? <span className={styles.hidden}>{field.label}</span> : field.label}
      {gate ? <FieldIcon name={field.name} /> : null}
      <input
        name={field.name}
        type={type}
        autoComplete={field.autoComplete}
        defaultValue={field.defaultValue}
        placeholder={gate ? (field.placeholder ?? field.label) : undefined}
        required
        minLength={field.minLength ?? (field.type === "password" ? 12 : undefined)}
      />
      {gate && field.type === "password" ? (
        <button
          className={styles.eye}
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
        >
          <Eye open={visible} />
        </button>
      ) : null}
    </label>
  );
}

function FieldIcon({ name }: { name: string }) {
  if (name === "password") {
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Eye({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      {open ? null : <path d="M5 19 19 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
    </svg>
  );
}
