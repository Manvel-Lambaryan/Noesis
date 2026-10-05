"use client";

import type { ReactNode } from "react";
import type { FeaturedProduct } from "./featured-products";
import { useCart } from "./cart-state";

export function AddToCart({ product, className, quiet = false, onQuiet, children }: {
  product: FeaturedProduct;
  className: string;
  quiet?: boolean;
  onQuiet?: () => void;
  children: ReactNode;
}) {
  const { add } = useCart();
  return (
    <button
      className={className}
      type="button"
      aria-label={`Add ${product.title} to cart`}
      onClick={() => {
        if (quiet) {
          onQuiet?.();
          return;
        }
        add({
          id: product.id,
          title: product.title,
          price: product.price,
          href: product.href,
          previewUrl: product.previewUrl,
          meta: product.meta,
        });
      }}
    >
      {children}
    </button>
  );
}
