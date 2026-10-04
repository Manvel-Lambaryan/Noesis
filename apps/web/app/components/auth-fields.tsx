"use client";

import { useState } from "react";
import { CountrySelect } from "./country-select";
import styles from "./auth-fields.module.css";

export type AuthField = {
  name: string;
  label: string;
  type: "email" | "password" | "text" | "tel";
  autoComplete: string;
  defaultValue?: string;
  minLength?: number;
  placeholder?: string;
};

export function AuthFields({ fields, gate }: { fields: AuthField[]; gate: boolean }) {
  return (
    <>
      {rowsOf(fields).map((row) => (
        isNamePair(row)
          ? <span key={row[0].name} className={`${styles.names} name-row`}><TextField field={row[0]} gate={gate} /><TextField field={row[1]} gate={gate} /></span>
          : <AuthControl key={row.name} field={row} gate={gate} />
      ))}
    </>
  );
}

function isNamePair(row: AuthField | readonly [AuthField, AuthField]): row is readonly [AuthField, AuthField] {
  return Array.isArray(row);
}

function rowsOf(fields: AuthField[]): Array<AuthField | readonly [AuthField, AuthField]> {
  const rows: Array<AuthField | readonly [AuthField, AuthField]> = [];
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const next = fields[index + 1];
    if (field !== undefined && next !== undefined && field.name === "givenName" && next.name === "familyName") {
      rows.push([field, next]);
      index += 1;
    } else if (field !== undefined) {
      rows.push(field);
    }
  }
  return rows;
}

function AuthControl({ field, gate }: { field: AuthField; gate: boolean }) {
  if (field.type === "tel") return <PhoneField field={field} gate={gate} />;
  return <TextField field={field} gate={gate} />;
}

function TextField({ field, gate }: { field: AuthField; gate: boolean }) {
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
        minLength={field.minLength ?? (field.type === "password" ? 8 : undefined)}
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

function PhoneField({ field, gate }: { field: AuthField; gate: boolean }) {
  return (
    <label className={gate ? styles.field : undefined}>
      {gate ? <span className={styles.hidden}>{field.label}</span> : field.label}
      <span className={`${styles.phone} phone-row`}>
        <CountrySelect />
        <input
          name={field.name}
          type="tel"
          autoComplete={field.autoComplete}
          placeholder={gate ? (field.placeholder ?? field.label) : undefined}
          required
          inputMode="tel"
          minLength={field.minLength ?? 4}
        />
      </span>
    </label>
  );
}

function FieldIcon({ name }: { name: string }) {
  if (name.includes("password")) return <LockIcon />;
  if (name === "phone") return <PhoneIcon />;
  if (name === "givenName" || name === "familyName") return <PersonIcon />;
  return <MailIcon />;
}

function LockIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4.5h2.2l1.1 3.2-1.6 1a11 11 0 0 0 5.6 5.6l1-1.6 3.2 1.1V16a2 2 0 0 1-2.2 2A14.5 14.5 0 0 1 6 6.7 2 2 0 0 1 8 4.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 19.2c.8-2.6 2.8-4 5.5-4s4.7 1.4 5.5 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
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
