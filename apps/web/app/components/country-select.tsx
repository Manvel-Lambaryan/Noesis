"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactElement, type RefObject, type SVGAttributes } from "react";
import { createPortal } from "react-dom";
import * as flags from "country-flag-icons/react/3x2";
import { PHONE_COUNTRIES, type PhoneCountry } from "../../lib/phone-countries";
import styles from "./country-select.module.css";

type FlagIcon = (props: SVGAttributes<SVGSVGElement>) => ReactElement;
type Typed = { text: string; timer: number };
type KeyState = {
  active: string;
  setActive: (iso: string) => void;
  onSelect: (iso: string) => void;
  onClose: () => void;
  typed: Typed;
};

export function CountrySelect() {
  const [iso, setIso] = useState("");
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const country = PHONE_COUNTRIES.find((item) => item.iso === iso);
  const listId = useId();
  const choose = (next: string) => {
    setIso(next);
    setOpen(false);
    button.current?.focus();
  };

  return (
    <span className={styles.root}>
      <input type="hidden" name="dial" value={country?.dial ?? ""} />
      <button
        ref={button}
        type="button"
        className={styles.trigger}
        aria-label={country ? `${country.name} +${country.dial}` : "Country"}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => onTriggerKey(event, open, () => setOpen(true))}
      >
        {country ? <Flag iso={country.iso} /> : null}
        <span className={styles.caption}>{country ? `+${country.dial}` : "Country"}</span>
        <Caret />
      </button>
      {open ? <CountryMenu id={listId} anchor={button} selected={iso} onSelect={choose} onClose={() => setOpen(false)} /> : null}
    </span>
  );
}

function CountryMenu(props: {
  id: string;
  anchor: RefObject<HTMLButtonElement | null>;
  selected: string;
  onSelect: (iso: string) => void;
  onClose: () => void;
}) {
  const first = PHONE_COUNTRIES[0];
  const [active, setActive] = useState(props.selected || (first ? first.iso : ""));
  const place = useMenuPlace(props.anchor);
  useMenuKeys(props.anchor, active, setActive, props.onSelect, props.onClose);
  useEffect(() => {
    document.getElementById(`country-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, place]);
  if (!place) return null;
  const scale = props.anchor.current?.closest(".auth-fit") ? 0.8 : 1;
  return createPortal(
    <ul id={props.id} role="listbox" data-country-menu className={styles.menu} style={{ top: place.top / scale, left: place.left / scale, width: place.width, zoom: scale }} aria-activedescendant={`country-option-${active}`}>
      {PHONE_COUNTRIES.map((country) => (
        <CountryOption key={country.iso} country={country} active={country.iso === active} selected={country.iso === props.selected} onSelect={props.onSelect} onActivate={setActive} />
      ))}
    </ul>,
    document.body,
  );
}

function CountryOption(props: {
  country: PhoneCountry;
  active: boolean;
  selected: boolean;
  onSelect: (iso: string) => void;
  onActivate: (iso: string) => void;
}) {
  const { country } = props;
  const className = props.active ? `${styles.option} ${styles.active}` : styles.option;
  return (
    <li>
      <button id={`country-option-${country.iso}`} type="button" role="option" data-iso={country.iso} aria-selected={props.selected} className={className} onMouseEnter={() => props.onActivate(country.iso)} onClick={() => props.onSelect(country.iso)}>
        <Flag iso={country.iso} />
        <span className={styles.name}>{country.name}</span>
        <span className={styles.dial}>+{country.dial}</span>
      </button>
    </li>
  );
}

function useMenuPlace(anchor: RefObject<HTMLButtonElement | null>) {
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);
  useEffect(() => {
    const node = anchor.current;
    if (!node) return;
    const place = () => setBox(menuBox(node.getBoundingClientRect()));
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor]);
  return box;
}

function useMenuKeys(
  anchor: RefObject<HTMLButtonElement | null>,
  active: string,
  setActive: (iso: string) => void,
  onSelect: (iso: string) => void,
  onClose: () => void,
): void {
  const typed = useRef<Typed>({ text: "", timer: 0 });
  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!(event.target instanceof Node) || anchor.current?.contains(event.target)) return;
      if (event.target instanceof Element && event.target.closest("[data-country-menu]")) return;
      onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (!menuOwnsFocus(anchor.current)) return;
      handleMenuKey(event, { active, setActive, onSelect, onClose, typed: typed.current });
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [active, anchor, onClose, onSelect, setActive]);
}

function menuBox(rect: DOMRect): { top: number; left: number; width: number } {
  const width = Math.min(300, window.innerWidth - 16);
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
  const height = 280;
  const below = window.innerHeight - rect.bottom;
  const top = below < height && rect.top > below ? Math.max(8, rect.top - height - 6) : rect.bottom + 6;
  return { top, left, width };
}

function menuOwnsFocus(anchor: HTMLButtonElement | null): boolean {
  const node = document.activeElement;
  if (!(node instanceof Node)) return false;
  if (anchor?.contains(node)) return true;
  return node instanceof Element && Boolean(node.closest("[data-country-menu]"));
}

function onTriggerKey(event: ReactKeyboardEvent<HTMLButtonElement>, open: boolean, openMenu: () => void): void {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    openMenu();
  }
  if (open && (event.key === "Enter" || event.key === " ")) event.preventDefault();
}

function handleMenuKey(event: KeyboardEvent, state: KeyState): void {
  if (event.key === "Escape") {
    state.onClose();
    return;
  }
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    state.onSelect(state.active);
    return;
  }
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    state.setActive(stepCountry(state.active, event.key === "ArrowDown" ? 1 : -1));
    return;
  }
  if (event.key.length === 1 && /\p{L}/u.test(event.key)) jumpToPrefix(event.key, state);
}

function stepCountry(iso: string, delta: number): string {
  const index = PHONE_COUNTRIES.findIndex((country) => country.iso === iso);
  const next = index < 0 ? 0 : (index + delta + PHONE_COUNTRIES.length) % PHONE_COUNTRIES.length;
  return PHONE_COUNTRIES[next]?.iso ?? iso;
}

function jumpToPrefix(key: string, state: KeyState): void {
  window.clearTimeout(state.typed.timer);
  state.typed.text = `${state.typed.text}${key}`.toLowerCase();
  state.typed.timer = window.setTimeout(() => { state.typed.text = ""; }, 600);
  const match = PHONE_COUNTRIES.find((country) => country.name.toLowerCase().startsWith(state.typed.text));
  if (match) state.setActive(match.iso);
}

function Flag({ iso }: { iso: string }) {
  const Icon = iconFor(iso);
  if (!Icon) return null;
  return <Icon className={styles.flag} aria-hidden="true" />;
}

function iconFor(iso: string): FlagIcon | undefined {
  const table = flags as Record<string, FlagIcon>;
  return table[iso];
}

function Caret() {
  return (
    <svg className={styles.caret} viewBox="0 0 12 8" aria-hidden="true">
      <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
