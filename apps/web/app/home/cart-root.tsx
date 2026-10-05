"use client";

import type { ReactNode } from "react";
import { CartSheet } from "./cart-sheet";
import { CartProvider } from "./cart-state";

export function CartRoot({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartSheet />
    </CartProvider>
  );
}
