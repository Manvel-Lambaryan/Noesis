"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Phone, UserRound } from "lucide-react";
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
          <EyeMark open={visible} />
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
  if (name.includes("password")) return <Lock className={styles.icon} strokeWidth={1.5} aria-hidden="true" />;
  if (name === "phone") return <Phone className={styles.icon} strokeWidth={1.5} aria-hidden="true" />;
  if (name === "givenName" || name === "familyName") return <UserRound className={styles.icon} strokeWidth={1.5} aria-hidden="true" />;
  return <Mail className={styles.icon} strokeWidth={1.5} aria-hidden="true" />;
}

function EyeMark({ open }: { open: boolean }) {
  const Icon = open ? Eye : EyeOff;
  return <Icon strokeWidth={1.5} aria-hidden="true" />;
}
