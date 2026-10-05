"use client";

import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

export type CartLine = {
  id: string;
  title: string;
  price: string;
  href: string;
  previewUrl: string | null;
  meta: string;
};

type CartApi = {
  lines: CartLine[];
  open: boolean;
  add: (line: CartLine) => void;
  remove: (id: string) => void;
  show: () => void;
  hide: () => void;
};

const CartContext = createContext<CartApi | null>(null);
const STORAGE_KEY = "noesis-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  useCartStorage(lines, setLines);
  const api = useMemo(() => cartApi(lines, setLines, open, setOpen), [lines, open]);
  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const value = useContext(CartContext);
  if (value === null) {
    throw new Error("Cart is unavailable");
  }
  return value;
}

function cartApi(lines: CartLine[], setLines: Dispatch<SetStateAction<CartLine[]>>, open: boolean, setOpen: Dispatch<SetStateAction<boolean>>): CartApi {
  return {
    lines,
    open,
    add: (line) => setLines((current) => current.some((item) => item.id === line.id) ? current : [...current, line]),
    remove: (id) => setLines((current) => current.filter((item) => item.id !== id)),
    show: () => setOpen(true),
    hide: () => setOpen(false),
  };
}

function useCartStorage(lines: CartLine[], setLines: Dispatch<SetStateAction<CartLine[]>>): void {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setLines(readCart());
    setHydrated(true);
  }, [setLines]);
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [hydrated, lines]);
}

function readCart(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.flatMap(asLine) : [];
  } catch {
    return [];
  }
}

function asLine(value: unknown): CartLine[] {
  if (typeof value !== "object" || value === null) return [];
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.title !== "string" || typeof item.price !== "string" || typeof item.href !== "string") return [];
  const previewUrl = typeof item.previewUrl === "string" ? item.previewUrl : null;
  const meta = typeof item.meta === "string" ? item.meta : "";
  return [{ id: item.id, title: item.title, price: item.price, href: item.href, previewUrl, meta }];
}
